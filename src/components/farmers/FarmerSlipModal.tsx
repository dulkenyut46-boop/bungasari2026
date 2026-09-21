import React from 'react';
import { Modal } from '../common/Modal';
import { Farmer, HarvestBatch } from '../../types';
import { formatRupiah, formatKg, formatDate, formatNumber } from '../../lib/utils';
import { Printer, Sprout, CheckCircle2, Download } from 'lucide-react';

interface FarmerSlipModalProps {
  farmer: Farmer | null;
  batches: HarvestBatch[];
  isOpen: boolean;
  onClose: () => void;
}

export const FarmerSlipModal: React.FC<FarmerSlipModalProps> = ({
  farmer,
  batches,
  isOpen,
  onClose,
}) => {
  if (!farmer) return null;

  // Extract all harvest items for this farmer across all batches
  const farmerRecords: {
    batchNumber: string;
    harvestDate: string;
    spbNumber: string;
    bunchCount?: number;
    tphWeightKg: number;
    tbsPricePerKg: number;
    groupDeductionRp: number;
    farmerShareRp: number;
    tphLocation: string;
  }[] = [];

  batches.forEach(b => {
    const item = b.items.find(i => i.farmerId === farmer.id);
    if (item) {
      farmerRecords.push({
        batchNumber: b.batchNumber,
        harvestDate: b.harvestDate,
        spbNumber: b.spbNumber,
        bunchCount: item.bunchCount || 0,
        tphWeightKg: item.tphWeightKg,
        tbsPricePerKg: b.tbsPricePerKg,
        groupDeductionRp: item.groupDeductionRp,
        farmerShareRp: item.farmerShareRp,
        tphLocation: item.tphLocation,
      });
    }
  });

  const totalKg = farmerRecords.reduce((sum, r) => sum + r.tphWeightKg, 0);
  const totalBunches = farmerRecords.reduce((sum, r) => sum + (r.bunchCount || 0), 0);
  const totalDeductions = farmerRecords.reduce((sum, r) => sum + r.groupDeductionRp, 0);
  const totalNetPayout = farmerRecords.reduce((sum, r) => sum + r.farmerShareRp, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Slip Rekapitulasi Hasil Panen`}
      subtitle={`${farmer.name} (${farmer.code}) - Kelompok Tani Bunga Sari`}
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Total Diterima:{' '}
            <span className="font-extrabold text-emerald-600">
              {formatRupiah(totalNetPayout)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Cetak Slip Pembayaran
            </button>
          </div>
        </div>
      }
    >
      {/* Printable Sheet */}
      <div id="printable-slip" className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Kop Surat Kelompok Tani */}
        <div className="border-b-2 border-emerald-600 pb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Sprout className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                KELOMPOK TANI BUNGA SARI
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Badan Usaha Kelompok Petani Sawit Rakyat • Riau, Indonesia
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-slate-900 dark:text-white">SLIP HASIL PANEN</div>
            <div className="text-slate-500">Tgl Cetak: {formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        {/* Farmer Profile Header Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <span className="text-slate-400 block font-medium">Nama Petani:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm block">
              {farmer.name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">No. Anggota:</span>
            <span className="font-bold text-slate-900 dark:text-white block font-mono">
              {farmer.code}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Lokasi Blok / TPH:</span>
            <span className="font-bold text-slate-900 dark:text-white block">
              {farmer.blockLocation}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Rekening Tujuan:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
              {farmer.bankAccount?.bankName} {farmer.bankAccount?.accountNumber}
            </span>
          </div>
        </div>

        {/* Table of Harvest Details */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">No. Batch & Tanggal</th>
                <th className="py-2.5 px-3">No SPB</th>
                <th className="py-2.5 px-3 text-right">Janjang</th>
                <th className="py-2.5 px-3 text-right">Berat TPH (Kg)</th>
                <th className="py-2.5 px-3 text-right">Harga TBS (Kg)</th>
                <th className="py-2.5 px-3 text-right">Iuran Kas (Rp 25)</th>
                <th className="py-2.5 px-3 text-right">Hak Bersih Diterima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {farmerRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada rekapan manen untuk petani ini pada periode berjalan.
                  </td>
                </tr>
              ) : (
                farmerRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {r.batchNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(r.harvestDate)}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {r.spbNumber}
                    </td>
                    <td className="py-2.5 px-3 text-right">{r.bunchCount}</td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {formatNumber(r.tphWeightKg)} Kg
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                      {formatRupiah(r.tbsPricePerKg)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      -{formatRupiah(r.groupDeductionRp)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(r.farmerShareRp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={2} className="py-3 px-3">
                  TOTAL PERIODE INI:
                </td>
                <td className="py-3 px-3 text-right">{totalBunches}</td>
                <td className="py-3 px-3 text-right">{formatKg(totalKg)}</td>
                <td className="py-3 px-3 text-right">-</td>
                <td className="py-3 px-3 text-right text-sky-600">
                  {formatRupiah(totalDeductions)}
                </td>
                <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-300 text-sm">
                  {formatRupiah(totalNetPayout)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signatures for Print */}
        <div className="grid grid-cols-2 pt-6 text-center text-xs">
          <div>
            <div className="text-slate-500">Penerima (Petani Anggota)</div>
            <div className="mt-12 font-bold underline text-slate-900 dark:text-white">
              {farmer.name}
            </div>
            <div className="text-[10px] text-slate-400">ID: {farmer.code}</div>
          </div>
          <div>
            <div className="text-slate-500">Ketua Poktan Bunga Sari</div>
            <div className="mt-12 font-bold underline text-slate-900 dark:text-white">
              H. Sudarsono
            </div>
            <div className="text-[10px] text-slate-400">Pengurus Kelompok</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
