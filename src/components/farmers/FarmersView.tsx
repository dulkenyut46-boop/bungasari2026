import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Farmer } from '../../types';
import { formatRupiah, formatKg, downloadCSV, downloadFarmerTemplate } from '../../lib/utils';
import { Badge } from '../common/Badge';
import { FarmerImportModal } from './FarmerImportModal';
import {
  Users,
  Search,
  Plus,
  FileText,
  Edit2,
  Trash2,
  Download,
  Upload,
  Phone,
  MapPin,
  Trees,
  CreditCard,
  Printer
} from 'lucide-react';

interface FarmersViewProps {
  onOpenNewFarmerModal: () => void;
  onEditFarmer: (farmer: Farmer) => void;
  onViewSlip: (farmer: Farmer) => void;
}

export const FarmersView: React.FC<FarmersViewProps> = ({
  onOpenNewFarmerModal,
  onEditFarmer,
  onViewSlip,
}) => {
  const { farmers, harvestBatches, deleteFarmer, currentUser, globalSearch } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [blockFilter, setBlockFilter] = useState('all');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const effectiveSearch = globalSearch || searchTerm;

  // Calculate stats for each farmer across all batches
  const farmerStatsMap = useMemo(() => {
    const map: Record<string, { totalKg: number; totalBunches: number; totalEarnings: number; batchesCount: number }> = {};
    farmers.forEach(f => {
      map[f.id] = { totalKg: 0, totalBunches: 0, totalEarnings: 0, batchesCount: 0 };
    });

    harvestBatches.forEach(b => {
      b.items.forEach(item => {
        if (map[item.farmerId]) {
          map[item.farmerId].totalKg += item.tphWeightKg;
          map[item.farmerId].totalBunches += item.bunchCount || 0;
          map[item.farmerId].totalEarnings += item.farmerShareRp;
          map[item.farmerId].batchesCount += 1;
        }
      });
    });

    return map;
  }, [farmers, harvestBatches]);

  // Extract unique blocks
  const uniqueBlocks = useMemo(() => {
    const blocks = new Set<string>();
    farmers.forEach(f => {
      const blockName = f.blockLocation.split('-')[0]?.trim();
      if (blockName) blocks.add(blockName);
    });
    return Array.from(blocks).sort();
  }, [farmers]);

  const filteredFarmers = useMemo(() => {
    return farmers.filter(f => {
      if (effectiveSearch) {
        const q = effectiveSearch.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchCode = f.code.toLowerCase().includes(q);
        const matchBlock = f.blockLocation.toLowerCase().includes(q);
        const matchPhone = f.phone.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchBlock && !matchPhone) return false;
      }

      if (blockFilter !== 'all') {
        if (!f.blockLocation.toLowerCase().includes(blockFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [farmers, effectiveSearch, blockFilter]);

  const handleExportCSV = () => {
    const headers = [
      'Kode Anggota',
      'Nama Petani',
      'No Telepon',
      'Luas Lahan (Ha)',
      'Lokasi Blok TPH',
      'Tahun Tanam',
      'Bank',
      'No Rekening',
      'Atas Nama',
      'Total Panen TPH (Kg)',
      'Total Janjang',
      'Total Hak Diterima (Rp)',
      'Status',
    ];

    const rows = filteredFarmers.map(f => {
      const stats = farmerStatsMap[f.id] || { totalKg: 0, totalBunches: 0, totalEarnings: 0 };
      return [
        f.code,
        f.name,
        f.phone,
        f.landAreaHa,
        f.blockLocation,
        f.plantYear,
        f.bankAccount?.bankName || '-',
        f.bankAccount?.accountNumber || '-',
        f.bankAccount?.accountHolder || '-',
        stats.totalKg,
        stats.totalBunches,
        stats.totalEarnings,
        f.status,
      ];
    });

    downloadCSV(`DATA_PETANI_BUNGA_SARI_${new Date().toISOString().split('T')[0]}`, [
      headers,
      ...rows,
    ]);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus anggota petani ${name}?`)) {
      deleteFarmer(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daftar Petani (20 Anggota Bunga Sari)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar anggota kelompok tani, catatan hasil panen per petani, dan cetak slip pembayaran
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadFarmerTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs"
            title="Unduh Template Excel Rapi (.xlsx) Data Petani"
          >
            <Download className="h-4 w-4 text-emerald-600" /> Template Petani (.xlsx)
          </button>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 cursor-pointer transition-colors shadow-2xs"
              title="Import Data Nama Petani Massal via Excel / CSV"
            >
              <Upload className="h-4 w-4" /> Import Petani (Excel/CSV)
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
              onClick={onOpenNewFarmerModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" /> Tambah Petani
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nama petani, nomor anggota, telepon..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <select
              value={blockFilter}
              onChange={e => setBlockFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Semua Blok Kebun</option>
              {uniqueBlocks.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end text-xs font-medium text-slate-500">
            <span>Total Anggota: <strong className="text-slate-900 dark:text-white">{filteredFarmers.length}</strong> Petani</span>
          </div>
        </div>
      </div>

      {/* Farmers Grid Cards / Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700/80">
              <tr>
                <th className="py-3 px-3.5">No. Anggota</th>
                <th className="py-3 px-3.5">Nama Petani</th>
                <th className="py-3 px-3.5">Blok & TPH</th>
                <th className="py-3 px-3 text-right">Luas Kebun</th>
                <th className="py-3 px-3 text-right">Total Panen (Kg)</th>
                <th className="py-3 px-3 text-right">Total Hak Bersih</th>
                <th className="py-3 px-3.5">Rekening Bank</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFarmers.map(farmer => {
                const stats = farmerStatsMap[farmer.id] || { totalKg: 0, totalEarnings: 0, totalBunches: 0 };
                return (
                  <tr
                    key={farmer.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {farmer.code}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {farmer.name}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {farmer.phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        {farmer.blockLocation}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-4.5">
                        Tanam: {farmer.plantYear}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium">
                      {farmer.landAreaHa} Ha
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {formatKg(stats.totalKg)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {stats.totalBunches} Janjang
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block text-sm">
                        {formatRupiah(stats.totalEarnings)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {farmer.bankAccount?.bankName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {farmer.bankAccount?.accountNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewSlip(farmer)}
                          title="Cetak Slip Panen Petani"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                        >
                          <Printer className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Slip</span>
                        </button>

                        {currentUser.role === 'admin' && (
                          <>
                            <button
                              onClick={() => onEditFarmer(farmer)}
                              title="Edit Petani"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-slate-800 dark:hover:text-sky-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(farmer.id, farmer.name)}
                              title="Hapus Petani"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Farmer Import Modal */}
      <FarmerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
