import React from 'react';
import { Modal } from '../common/Modal';
import { HarvestBatch } from '../../types';
import { formatRupiah, formatKg, formatDate, formatNumber } from '../../lib/utils';
import { Badge } from '../common/Badge';
import {
  Printer,
  Truck,
  Scale,
  Factory,
  Coins,
  FileCheck,
  Building2,
  Calendar,
  User,
  Info
} from 'lucide-react';

interface HarvestBatchDetailModalProps {
  batch: HarvestBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (batch: HarvestBatch) => void;
}

export const HarvestBatchDetailModal: React.FC<HarvestBatchDetailModalProps> = ({
  batch,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!batch) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rekapitulasi Panen: ${batch.batchNumber}`}
      subtitle={`SPB: ${batch.spbNumber} | Tiket PKS: ${batch.ticketNumberPKS}`}
      maxWidth="3xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-slate-500">
            Status:{' '}
            <span className="font-semibold text-emerald-600 uppercase">
              {batch.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Cetak Lembar Rekap
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(batch);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Edit Rekapan
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Top Summary Cards: Kebun vs Pabrik vs Selisih */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* TPH Kebun */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 dark:border-sky-900/50 dark:bg-sky-950/20">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300">
              <Scale className="h-4 w-4" /> TIMBANGAN KEBUN (TPH)
            </div>
            <div className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
              {formatKg(batch.totalTphWeightKg)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Total: {batch.totalBunches} Janjang ({batch.items.length} Petani)
            </div>
          </div>

          {/* Pabrik PKS */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Factory className="h-4 w-4" /> NETTO PABRIK (PKS)
            </div>
            <div className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
              {formatKg(batch.factoryFinalNetKg)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sortir {batch.sortirPercentage}% ({batch.sortirKg} Kg)
            </div>
          </div>

          {/* Selisih Medaran */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Coins className="h-4 w-4" /> SELISIH MEDARAN LEBIH
            </div>
            <div className="mt-2 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              +{batch.weightDifferenceKg} Kg
            </div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
              Omset: {formatRupiah(batch.medaranOmsetValueRp)}
            </div>
          </div>
        </div>

        {/* Operational & Transport Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <span className="text-slate-400 block font-medium">Tanggal Panen:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {formatDate(batch.harvestDate)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Pabrik Tujuan:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
              {batch.factoryDestination}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Truk & Sopir:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {batch.truckPlate} ({batch.driverName})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Harga TBS Pabrik:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(batch.tbsPricePerKg)} / Kg
            </span>
          </div>
        </div>

        {/* Breakdown Petani Table (Catatan Per Manen TPH) */}
        <div>
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Daftar Timbangan Petani di Kebun (TPH):
            </h4>
            <span className="text-xs text-slate-500">
              {batch.items.length} Anggota Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            {(() => {
              const hasJanjang = batch.items.some(i => (i.bunchCount || 0) > 0);
              return (
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100/70 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Petani</th>
                      <th className="py-2.5 px-3">Lokasi TPH</th>
                      {hasJanjang && <th className="py-2.5 px-3 text-right">Janjang</th>}
                      <th className="py-2.5 px-3 text-right">Berat TPH (Kg)</th>
                      {hasJanjang && <th className="py-2.5 px-3 text-right">BJR (Kg/Jjg)</th>}
                      <th className="py-2.5 px-3 text-right">Iuran Kas (Rp 25)</th>
                      <th className="py-2.5 px-3 text-right">Hak Petani</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {batch.items.map((item, idx) => {
                      const bjr = (item.bunchCount || 0) > 0 ? (item.tphWeightKg / item.bunchCount!).toFixed(1) : '-';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                            {item.farmerName}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{item.tphLocation}</td>
                          {hasJanjang && <td className="py-2 px-3 text-right">{item.bunchCount || '-'}</td>}
                          <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-slate-100">
                            {formatNumber(item.tphWeightKg)} Kg
                          </td>
                          {hasJanjang && <td className="py-2 px-3 text-right text-slate-500">{bjr}</td>}
                          <td className="py-2 px-3 text-right text-slate-500">
                            {formatRupiah(item.groupDeductionRp)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(item.farmerShareRp)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50/80 font-bold text-slate-900 dark:bg-slate-800/80 dark:text-white border-t border-slate-200 dark:border-slate-700">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3">
                        TOTAL KEBUN (TPH):
                      </td>
                      {hasJanjang && <td className="py-2.5 px-3 text-right">{batch.totalBunches || '-'}</td>}
                      <td className="py-2.5 px-3 text-right">{formatKg(batch.totalTphWeightKg)}</td>
                      {hasJanjang && (
                        <td className="py-2.5 px-3 text-right">
                          {batch.totalBunches ? (batch.totalTphWeightKg / batch.totalBunches).toFixed(1) : '-'}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right text-sky-600">
                        {formatRupiah(batch.groupFeeTotalRp)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">
                        {formatRupiah(batch.totalFarmerPayoutRp)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              );
            })()}
          </div>
        </div>

        {/* Kalkulasi Omset Kelompok Tani Detail Box */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 mb-2">
            Perhitungan Omset Kelompok Tani Bunga Sari:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>1. Selisih Medaran Lebih:</span>
                <span className="font-semibold">{batch.weightDifferenceKg} Kg x {formatRupiah(batch.tbsPricePerKg)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-300">
                <span>Subtotal Medaran:</span>
                <span>{formatRupiah(batch.medaranOmsetValueRp)}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>2. Iuran Kas Poktan:</span>
                <span className="font-semibold">{batch.totalTphWeightKg} Kg x Rp {batch.groupFeePerKg}</span>
              </div>
              <div className="flex justify-between font-bold text-sky-700 dark:text-sky-300">
                <span>Subtotal Iuran Kas:</span>
                <span>{formatRupiah(batch.groupFeeTotalRp)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-sm font-extrabold text-emerald-900 dark:text-emerald-100">
            <span>TOTAL OMSET KELOMPOK DARI MANEN INI:</span>
            <span className="text-base text-emerald-700 dark:text-emerald-300">
              {formatRupiah(batch.totalGroupOmsetRp)}
            </span>
          </div>
        </div>

        {batch.notes && (
          <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg dark:bg-slate-800/50">
            Catatan: {batch.notes}
          </div>
        )}
      </div>
    </Modal>
  );
};
