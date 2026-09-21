import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { HarvestBatch, HarvestFarmerDetail } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatRupiah,
  formatNumber,
  formatKg,
  parseCSV,
  downloadTphWeighingTemplate,
} from '../../lib/utils';
import {
  Plus,
  Trash2,
  Calculator,
  Info,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';

interface HarvestBatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchToEdit?: HarvestBatch | null;
}

export const HarvestBatchFormModal: React.FC<HarvestBatchFormModalProps> = ({
  isOpen,
  onClose,
  batchToEdit,
}) => {
  const { farmers, addHarvestBatch, updateHarvestBatch, currentUser, showToast } = useApp();

  const [batchNumber, setBatchNumber] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [factoryDate, setFactoryDate] = useState('');
  const [driverName, setDriverName] = useState('Pak Darno');
  const [truckPlate, setTruckPlate] = useState('BM 8342 QA');
  const [factoryDestination, setFactoryDestination] = useState('PKS PT Sawit Makmur Perkasa');
  const [spbNumber, setSpbNumber] = useState('');
  const [ticketNumberPKS, setTicketNumberPKS] = useState('');
  const [tbsPricePerKg, setTbsPricePerKg] = useState<number>(2950);
  const [groupFeePerKg, setGroupFeePerKg] = useState<number>(25);

  // Factory Weights
  const [factoryGrossKg, setFactoryGrossKg] = useState<number>(21500);
  const [factoryTareKg, setFactoryTareKg] = useState<number>(7720);
  const [sortirPercentage, setSortirPercentage] = useState<number>(1.5);

  // Farmer details list
  const [items, setItems] = useState<HarvestFarmerDetail[]>([]);
  const [notes, setNotes] = useState('');

  // Reset or initialize form when opened
  useEffect(() => {
    if (batchToEdit) {
      setBatchNumber(batchToEdit.batchNumber);
      setHarvestDate(batchToEdit.harvestDate);
      setFactoryDate(batchToEdit.factoryDate);
      setDriverName(batchToEdit.driverName);
      setTruckPlate(batchToEdit.truckPlate);
      setFactoryDestination(batchToEdit.factoryDestination);
      setSpbNumber(batchToEdit.spbNumber);
      setTicketNumberPKS(batchToEdit.ticketNumberPKS);
      setTbsPricePerKg(batchToEdit.tbsPricePerKg);
      setGroupFeePerKg(batchToEdit.groupFeePerKg);
      setFactoryGrossKg(batchToEdit.factoryGrossKg);
      setFactoryTareKg(batchToEdit.factoryTareKg);
      setSortirPercentage(batchToEdit.sortirPercentage);
      setItems(batchToEdit.items || []);
      setNotes(batchToEdit.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      setBatchNumber(`BS/PANEN/2026/${randomSuffix}`);
      setHarvestDate(today);
      setFactoryDate(today);
      setDriverName('Pak Darno');
      setTruckPlate('BM 8342 QA');
      setFactoryDestination('PKS PT Sawit Makmur Perkasa');
      setSpbNumber(`SPB-BS-${randomSuffix}`);
      setTicketNumberPKS(`TK-PKS-${Math.floor(10000 + Math.random() * 90000)}`);
      setTbsPricePerKg(2950);
      setGroupFeePerKg(25);
      setFactoryGrossKg(21800);
      setFactoryTareKg(7720);
      setSortirPercentage(1.5);
      setNotes('');

      // Initialize with first 4 farmers as initial rows without bunch count
      if (farmers.length > 0) {
        const initialRows: HarvestFarmerDetail[] = farmers.slice(0, 4).map((f, idx) => ({
          farmerId: f.id,
          farmerName: f.name,
          bunchCount: 0,
          tphWeightKg: 1800 + idx * 250,
          tphLocation: f.blockLocation.split('-')[1]?.trim() || `TPH 0${idx + 1}`,
          sortirDeductionKg: 0,
          netTphKg: 1800 + idx * 250,
          farmerShareRp: (1800 + idx * 250) * (2950 - 25),
          groupDeductionRp: (1800 + idx * 250) * 25,
        }));
        setItems(initialRows);
      }
    }
  }, [batchToEdit, isOpen, farmers]);

  // Derived Factory calculations
  const factoryNetKg = Math.max(0, factoryGrossKg - factoryTareKg);
  const sortirKg = Math.round((factoryNetKg * sortirPercentage) / 100);
  const factoryFinalNetKg = Math.max(0, factoryNetKg - sortirKg);

  // Derived TPH calculations
  const totalBunches = items.reduce((sum, item) => sum + (Number(item.bunchCount) || 0), 0);
  const totalTphWeightKg = items.reduce((sum, item) => sum + (Number(item.tphWeightKg) || 0), 0);

  // Derived Selisih & Omset Medaran
  const weightDifferenceKg = factoryFinalNetKg - totalTphWeightKg;
  const differenceStatus = weightDifferenceKg > 0 ? 'surplus' : weightDifferenceKg < 0 ? 'susut' : 'imbang';
  const medaranOmsetValueRp = weightDifferenceKg > 0 ? Math.round(weightDifferenceKg * tbsPricePerKg) : 0;
  const groupFeeTotalRp = Math.round(totalTphWeightKg * groupFeePerKg);
  const totalGroupOmsetRp = medaranOmsetValueRp + groupFeeTotalRp;

  const totalFarmerPayoutRp = items.reduce((sum, item) => sum + (item.farmerShareRp || 0), 0);

  // Update item field
  const handleItemChange = (
    index: number,
    field: keyof HarvestFarmerDetail,
    value: string | number
  ) => {
    setItems(prev => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === 'farmerId') {
        const farmerObj = farmers.find(f => f.id === value);
        if (farmerObj) {
          target.farmerName = farmerObj.name;
          target.tphLocation = farmerObj.blockLocation;
        }
      }

      // Recalculate item financials
      const weight = Number(target.tphWeightKg) || 0;
      target.netTphKg = weight;
      target.groupDeductionRp = Math.round(weight * groupFeePerKg);
      target.farmerShareRp = Math.round(weight * (tbsPricePerKg - groupFeePerKg));

      updated[index] = target;
      return updated;
    });
  };

  // Add new farmer row
  const handleAddRow = () => {
    const usedFarmerIds = new Set(items.map(i => i.farmerId));
    const availableFarmer = farmers.find(f => !usedFarmerIds.has(f.id)) || farmers[0];

    const newRow: HarvestFarmerDetail = {
      farmerId: availableFarmer.id,
      farmerName: availableFarmer.name,
      bunchCount: 0,
      tphWeightKg: 1600,
      tphLocation: availableFarmer.blockLocation,
      sortirDeductionKg: 0,
      netTphKg: 1600,
      farmerShareRp: 1600 * (tbsPricePerKg - groupFeePerKg),
      groupDeductionRp: 1600 * groupFeePerKg,
    };
    setItems(prev => [...prev, newRow]);
  };

  // Import TPH weighing CSV
  const handleImportTphCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length < 2) {
          showToast('File CSV timbangan kosong atau tidak valid', 'error');
          return;
        }

        const header = parsed[0].map(h => h.toLowerCase().trim());
        const nameIdx = header.findIndex(h => h.includes('nama') || h.includes('petani'));
        const locIdx = header.findIndex(h => h.includes('lokasi') || h.includes('tph') || h.includes('blok'));
        const weightIdx = header.findIndex(h => h.includes('berat') || h.includes('kg') || h.includes('timbang'));

        if (nameIdx === -1 || weightIdx === -1) {
          showToast('Format kolom CSV tidak sesuai. Gunakan kolom: Nama Petani, Lokasi TPH, Berat TPH (Kg)', 'error');
          return;
        }

        const newItems: HarvestFarmerDetail[] = [];
        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (!row || row.length <= Math.max(nameIdx, weightIdx)) continue;
          const rawName = row[nameIdx]?.trim();
          if (!rawName) continue;

          const rawLoc = locIdx !== -1 ? row[locIdx]?.trim() || `TPH 0${i}` : `TPH 0${i}`;
          const cleanWeightStr = row[weightIdx]?.replace(/[^0-9.]/g, '') || '0';
          const weight = parseFloat(cleanWeightStr) || 0;

          // Match with registered farmer or fallback
          const matched = farmers.find(
            f => f.name.toLowerCase().includes(rawName.toLowerCase()) || rawName.toLowerCase().includes(f.name.toLowerCase())
          );

          newItems.push({
            farmerId: matched?.id || `farmer-tph-${i}`,
            farmerName: matched ? matched.name : rawName,
            bunchCount: 0,
            tphWeightKg: weight,
            tphLocation: rawLoc || matched?.blockLocation || `TPH 0${i}`,
            sortirDeductionKg: 0,
            netTphKg: weight,
            farmerShareRp: Math.round(weight * (tbsPricePerKg - groupFeePerKg)),
            groupDeductionRp: Math.round(weight * groupFeePerKg),
          });
        }

        if (newItems.length > 0) {
          setItems(newItems);
          showToast(`Berhasil mengimpor ${newItems.length} data timbangan TPH petani!`, 'success');
        } else {
          showToast('Tidak ada baris timbangan valid dalam file CSV', 'error');
        }
      } catch (err) {
        showToast('Gagal memproses file CSV', 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Remove farmer row
  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const batchData: Omit<HarvestBatch, 'id'> = {
      batchNumber,
      harvestDate,
      factoryDate: factoryDate || harvestDate,
      driverName,
      truckPlate,
      factoryDestination,
      spbNumber,
      ticketNumberPKS,
      totalBunches,
      totalTphWeightKg,
      factoryGrossKg,
      factoryTareKg,
      factoryNetKg,
      sortirPercentage,
      sortirKg,
      factoryFinalNetKg,
      weightDifferenceKg,
      differenceStatus,
      tbsPricePerKg,
      medaranOmsetValueRp,
      groupFeePerKg,
      groupFeeTotalRp,
      totalGroupOmsetRp,
      totalFarmerPayoutRp,
      transportFeeRp: Math.round(totalTphWeightKg * 150),
      loadingFeeRp: Math.round(totalTphWeightKg * 50),
      status: 'selesai',
      notes,
      items,
    };

    if (batchToEdit) {
      updateHarvestBatch(batchToEdit.id, batchData);
    } else {
      addHarvestBatch(batchData);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={batchToEdit ? `Edit Rekapan Panen: ${batchToEdit.batchNumber}` : 'Catat Hasil Panen Baru (TPH vs Pabrik)'}
      subtitle="Masukkan data timbangan kebun dan timbangan pabrik untuk menghitung selisih medaran lebih"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Estimasi Omset Kelompok:{' '}
            <span className="font-extrabold text-emerald-600">
              {formatRupiah(totalGroupOmsetRp)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
            >
              {batchToEdit ? 'Simpan Perubahan' : 'Simpan Rekapan Panen'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Batch & Transport Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Informasi Surat Pengantar Buah (SPB) & Pengiriman
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. SPB Kebun *
              </label>
              <input
                type="text"
                required
                value={spbNumber}
                onChange={e => setSpbNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Panen *
              </label>
              <input
                type="date"
                required
                value={harvestDate}
                onChange={e => setHarvestDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Polisi Truk
              </label>
              <input
                type="text"
                value={truckPlate}
                onChange={e => setTruckPlate(e.target.value)}
                placeholder="BM 8342 QA"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Sopir
              </label>
              <input
                type="text"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                placeholder="Pak Darno"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PKS Tujuan
              </label>
              <input
                type="text"
                value={factoryDestination}
                onChange={e => setFactoryDestination(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Harga TBS Pabrik (Rp / Kg) *
              </label>
              <input
                type="number"
                required
                value={tbsPricePerKg}
                onChange={e => setTbsPricePerKg(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Iuran Kas Kelompok (Rp / Kg)
              </label>
              <input
                type="number"
                value={groupFeePerKg}
                onChange={e => setGroupFeePerKg(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Factory Weighing Inputs (Tiket Timbang PKS) */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
              Hasil Timbangan Pabrik Kelapa Sawit (PKS)
            </h4>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Netto Akhir Pabrik: {formatKg(factoryFinalNetKg)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No Tiket Timbang PKS
              </label>
              <input
                type="text"
                value={ticketNumberPKS}
                onChange={e => setTicketNumberPKS(e.target.value)}
                placeholder="TK-PKS-98214"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bruto Truk (Kg)
              </label>
              <input
                type="number"
                value={factoryGrossKg}
                onChange={e => setFactoryGrossKg(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tarra Truk Kosong (Kg)
              </label>
              <input
                type="number"
                value={factoryTareKg}
                onChange={e => setFactoryTareKg(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sortir Pabrik (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={sortirPercentage}
                onChange={e => setSortirPercentage(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Farmer TPH Items Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pencatatan Timbangan di Kebun (TPH) per Petani
              </h4>
              <p className="text-[11px] text-slate-500">
                Total TPH Kebun: <span className="font-bold text-slate-900 dark:text-white">{formatKg(totalTphWeightKg)}</span> ({items.length} Petani Terdaftar)
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadTphWeighingTemplate}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs"
                title="Unduh format template CSV timbangan TPH"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" /> Template TPH
              </button>

              <label
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer transition-colors shadow-2xs"
                title="Import data timbangan TPH dari file CSV"
              >
                <Upload className="h-3.5 w-3.5" /> Import TPH (CSV)
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportTphCSV}
                />
              </label>

              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-xs font-bold hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Baris
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Nama Petani</th>
                  <th className="p-2.5">Lokasi TPH</th>
                  <th className="p-2.5 w-36">Berat TPH (Kg) *</th>
                  <th className="p-2.5 text-right w-28">Iuran Kas (Rp)</th>
                  <th className="p-2.5 text-right w-32">Hak Petani (Rp)</th>
                  <th className="p-2.5 w-10 text-center">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2">
                      <select
                        value={item.farmerId}
                        onChange={e => handleItemChange(index, 'farmerId', e.target.value)}
                        className="w-full rounded border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                      >
                        {farmers.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.code})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.tphLocation}
                        onChange={e => handleItemChange(index, 'tphLocation', e.target.value)}
                        placeholder="TPH 01"
                        className="w-full rounded border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={item.tphWeightKg}
                        onChange={e => handleItemChange(index, 'tphWeightKg', Number(e.target.value))}
                        className="w-full rounded border border-slate-200 bg-white p-1 text-xs font-semibold text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                      />
                    </td>
                    <td className="p-2 text-right text-slate-500 dark:text-slate-400">
                      {formatRupiah(item.groupDeductionRp || 0)}
                    </td>
                    <td className="p-2 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {formatRupiah(item.farmerShareRp || 0)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        title="Hapus baris"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Calculation Summary Banner */}
        <div className="rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-teal-950/40">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2">
            <Calculator className="h-4 w-4" /> Ringkasan Perhitungan Selisih Medaran & Omset
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Total TPH Kebun:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatKg(totalTphWeightKg)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Netto PKS Pabrik:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatKg(factoryFinalNetKg)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Selisih Medaran:</span>
              <span className={`font-extrabold ${weightDifferenceKg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {weightDifferenceKg >= 0 ? `+${weightDifferenceKg} Kg (Surplus)` : `${weightDifferenceKg} Kg (Susut)`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Omset Kelompok Tani:</span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                {formatRupiah(totalGroupOmsetRp)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Catatan / Keterangan Tambahan
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Contoh: Kondisi buah segar kematangan optimal fraksi 2 & 3, jalan kebun lancar..."
            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </form>
    </Modal>
  );
};
