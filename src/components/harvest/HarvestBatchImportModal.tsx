import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { HarvestBatch } from '../../types';
import { useApp } from '../../context/AppContext';
import { parseSpreadsheetFile, downloadHarvestBatchTemplate, formatRupiah, formatKg } from '../../lib/utils';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface HarvestBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HarvestBatchImportModal: React.FC<HarvestBatchImportModalProps> = ({ isOpen, onClose }) => {
  const { bulkAddHarvestBatches, showToast, farmers } = useApp();
  const [parsedBatches, setParsedBatches] = useState<Omit<HarvestBatch, 'id'>[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setParsedBatches([]);
    setFileName('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = async (file: File) => {
    const validExts = ['.xlsx', '.xls', '.csv'];
    const isSupported = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isSupported) {
      setErrorMsg('Format file harus berupa Excel (.xlsx, .xls) atau .csv');
      return;
    }

    setErrorMsg('');
    setFileName(file.name);

    try {
      const rows = await parseSpreadsheetFile(file);

      if (rows.length < 2) {
        setErrorMsg('File Excel / CSV tidak berisi data atau baris kosong.');
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      const batchNumIdx = headers.findIndex(h => h.includes('spb') || h.includes('batch') || h.includes('nomor'));
      const harvestDateIdx = headers.findIndex(h => h.includes('tanggal panen') || h.includes('tgl panen'));
      const factoryDateIdx = headers.findIndex(h => h.includes('tanggal pabrik') || h.includes('tgl pabrik'));
      const driverIdx = headers.findIndex(h => h.includes('supir') || h.includes('driver'));
      const plateIdx = headers.findIndex(h => h.includes('polisi') || h.includes('plat') || h.includes('truk'));
      const factoryIdx = headers.findIndex(h => h.includes('pabrik') || h.includes('pks'));
      const priceIdx = headers.findIndex(h => h.includes('harga') || h.includes('tbs') || h.includes('rp'));
      const feeIdx = headers.findIndex(h => h.includes('iuran') || h.includes('kas'));
      const grossIdx = headers.findIndex(h => h.includes('bruto'));
      const tareIdx = headers.findIndex(h => h.includes('tarra') || h.includes('tara'));
      const sortirIdx = headers.findIndex(h => h.includes('sortir'));
      const tphWeightIdx = headers.findIndex(h => h.includes('total tph') || h.includes('kebun') || h.includes('tph'));

      const newBatches: Omit<HarvestBatch, 'id'>[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const batchNumber = (batchNumIdx !== -1 && row[batchNumIdx]?.trim()) 
          ? row[batchNumIdx]?.trim() 
          : `BS/PANEN/2026/IMP-${i}`;

        const harvestDate = (harvestDateIdx !== -1 && row[harvestDateIdx]?.trim())
          ? row[harvestDateIdx]?.trim()
          : new Date().toISOString().split('T')[0];

        const factoryDate = (factoryDateIdx !== -1 && row[factoryDateIdx]?.trim())
          ? row[factoryDateIdx]?.trim()
          : harvestDate;

        const driverName = (driverIdx !== -1 && row[driverIdx]?.trim()) ? row[driverIdx]?.trim() : 'Supir Kelompok';
        const truckPlate = (plateIdx !== -1 && row[plateIdx]?.trim()) ? row[plateIdx]?.trim() : 'BM 8000 BS';
        const factoryDestination = (factoryIdx !== -1 && row[factoryIdx]?.trim()) 
          ? row[factoryIdx]?.trim() 
          : 'PKS Sawit Bunga Sari';

        const tbsPricePerKg = priceIdx !== -1 ? parseFloat(row[priceIdx]?.replace(/[^0-9.]/g, '') || '2950') || 2950 : 2950;
        const groupFeePerKg = feeIdx !== -1 ? parseFloat(row[feeIdx]?.replace(/[^0-9.]/g, '') || '25') || 25 : 25;

        const factoryGrossKg = grossIdx !== -1 ? parseFloat(row[grossIdx]?.replace(/[^0-9.]/g, '') || '0') || 0 : 0;
        const factoryTareKg = tareIdx !== -1 ? parseFloat(row[tareIdx]?.replace(/[^0-9.]/g, '') || '0') || 0 : 0;
        const sortirPercentage = sortirIdx !== -1 ? parseFloat(row[sortirIdx]?.replace(/[^0-9.]/g, '') || '1.5') || 1.5 : 1.5;

        const factoryNetKg = Math.max(0, factoryGrossKg - factoryTareKg);
        const sortirKg = Math.round((factoryNetKg * sortirPercentage) / 100);
        const factoryFinalNetKg = Math.max(0, factoryNetKg - sortirKg);

        const totalTphWeightKg = tphWeightIdx !== -1 ? parseFloat(row[tphWeightIdx]?.replace(/[^0-9.]/g, '') || '0') || 0 : 0;

        const weightDifferenceKg = factoryFinalNetKg - totalTphWeightKg;
        const differenceStatus: 'surplus' | 'susut' | 'imbang' = weightDifferenceKg > 0 ? 'surplus' : weightDifferenceKg < 0 ? 'susut' : 'imbang';
        const medaranOmsetValueRp = weightDifferenceKg > 0 ? Math.round(weightDifferenceKg * tbsPricePerKg) : 0;
        const groupFeeTotalRp = Math.round(totalTphWeightKg * groupFeePerKg);
        const totalGroupOmsetRp = medaranOmsetValueRp + groupFeeTotalRp;

        // Default items assigned to first few farmers if available
        const batchItems = farmers.slice(0, 3).map((f) => {
          const shareKg = Math.round(totalTphWeightKg / Math.min(farmers.length || 1, 3));
          return {
            farmerId: f.id,
            farmerName: f.name,
            bunchCount: 0,
            tphWeightKg: shareKg,
            tphLocation: f.blockLocation,
            netTphKg: shareKg,
            farmerShareRp: Math.round(shareKg * (tbsPricePerKg - groupFeePerKg)),
            groupDeductionRp: Math.round(shareKg * groupFeePerKg),
          };
        });

        const totalFarmerPayoutRp = batchItems.reduce((s, it) => s + (it.farmerShareRp || 0), 0);

        newBatches.push({
          batchNumber,
          harvestDate,
          factoryDate,
          driverName,
          truckPlate,
          factoryDestination,
          spbNumber: batchNumber,
          ticketNumberPKS: `TK-PKS-${Math.floor(10000 + Math.random() * 90000)}`,
          totalTphWeightKg,
          factoryGrossKg,
          factoryTareKg,
          factoryNetKg,
          sortirPercentage,
          sortirKg,
          factoryFinalNetKg,
          tbsPricePerKg,
          groupFeePerKg,
          weightDifferenceKg,
          differenceStatus,
          medaranOmsetValueRp,
          groupFeeTotalRp,
          totalGroupOmsetRp,
          totalFarmerPayoutRp,
          transportFeeRp: 0,
          loadingFeeRp: 0,
          items: batchItems,
          status: 'selesai',
          notes: 'Diimpor via Excel / CSV',
        });
      }

      if (newBatches.length === 0) {
        setErrorMsg('Tidak ada baris panen yang dapat diproses dari file ini.');
      } else {
        setParsedBatches(newBatches);
      }
    } catch {
      setErrorMsg('Gagal membaca isi file Excel / CSV.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfirmImport = () => {
    if (parsedBatches.length === 0) return;
    bulkAddHarvestBatches(parsedBatches);
    handleClose();
  };

  const handleRemoveRow = (idx: number) => {
    setParsedBatches(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Catatan Panen Baru (Excel / CSV)"
      subtitle="Unggah file Excel (.xlsx) atau CSV rekapan timbangan TPH dan pabrik untuk mencatat panen massal"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedBatches.length > 0 ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {parsedBatches.length} catatan panen siap diimpor & dicatat ke kas
              </span>
            ) : (
              'Format Excel: No SPB, Tanggal, Pabrik, Harga TBS, Bruto, Tarra, Sortir %, Berat TPH'
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={parsedBatches.length === 0}
              onClick={handleConfirmImport}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              Simpan & Impor Panen {parsedBatches.length > 0 ? `(${parsedBatches.length})` : ''}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Template download notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Gunakan Template Excel Panen Baru Resmi (.xlsx)
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                File Excel yang rapi dengan kolom timbangan TPH dan Pabrik PKS terstruktur jelas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadHarvestBatchTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300 cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" /> Unduh Template Excel (.xlsx)
          </button>
        </div>

        {/* Upload drop zone */}
        {parsedBatches.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/60 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Klik untuk memilih file Excel (.xlsx / .xls) atau CSV, atau seret ke sini
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Mendukung Microsoft Excel (.xlsx, .xls) dan CSV
            </p>
            {fileName && (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> {fileName}
              </span>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pratinjau Rekapan Panen ({parsedBatches.length} Batch Terbaca)
                </span>
                <span className="text-[11px] text-slate-500">dari file: {fileName}</span>
              </div>
              <button
                type="button"
                onClick={resetState}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Ganti File
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2">No SPB</th>
                    <th className="p-2">Tanggal</th>
                    <th className="p-2 text-right">Netto PKS</th>
                    <th className="p-2 text-right">TPH Kebun</th>
                    <th className="p-2 text-right">Selisih</th>
                    <th className="p-2 text-right">Harga TBS</th>
                    <th className="p-2 text-right">Omset Medaran</th>
                    <th className="p-2 text-center w-8">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedBatches.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {b.batchNumber}
                      </td>
                      <td className="p-2">{b.harvestDate}</td>
                      <td className="p-2 text-right font-semibold">{formatKg(b.factoryFinalNetKg)}</td>
                      <td className="p-2 text-right">{formatKg(b.totalTphWeightKg)}</td>
                      <td className="p-2 text-right">
                        <span
                          className={`font-semibold ${
                            b.weightDifferenceKg > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : b.weightDifferenceKg < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-600'
                          }`}
                        >
                          {b.weightDifferenceKg > 0 ? '+' : ''}
                          {formatKg(b.weightDifferenceKg)}
                        </span>
                      </td>
                      <td className="p-2 text-right">{formatRupiah(b.tbsPricePerKg)}</td>
                      <td className="p-2 text-right font-semibold text-emerald-700 dark:text-emerald-300">
                        {formatRupiah(b.medaranOmsetValueRp)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
