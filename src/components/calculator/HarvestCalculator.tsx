import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatKg, formatNumber } from '../../lib/utils';
import {
  Calculator,
  Scale,
  Factory,
  Coins,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface HarvestCalculatorProps {
  onOpenNewBatchWithValues?: (values: any) => void;
}

export const HarvestCalculator: React.FC<HarvestCalculatorProps> = ({
  onOpenNewBatchWithValues,
}) => {
  const { metrics, currentUser, setActiveTab } = useApp();

  // Inputs
  const [tphWeightKg, setTphWeightKg] = useState<number>(13850);
  const [bunchCount, setBunchCount] = useState<number>(780);
  const [factoryGrossKg, setFactoryGrossKg] = useState<number>(21920);
  const [factoryTareKg, setFactoryTareKg] = useState<number>(7720);
  const [sortirPercentage, setSortirPercentage] = useState<number>(1.5);
  const [tbsPricePerKg, setTbsPricePerKg] = useState<number>(2950);
  const [groupFeePerKg, setGroupFeePerKg] = useState<number>(25);

  // Calculations
  const factoryNetKg = Math.max(0, factoryGrossKg - factoryTareKg);
  const sortirKg = Math.round((factoryNetKg * sortirPercentage) / 100);
  const factoryFinalNetKg = Math.max(0, factoryNetKg - sortirKg);

  const weightDifferenceKg = factoryFinalNetKg - tphWeightKg;
  const isSurplus = weightDifferenceKg >= 0;
  const differencePercentage = tphWeightKg > 0 ? (weightDifferenceKg / tphWeightKg) * 100 : 0;

  // Medaran Value & Kas Poktan
  const medaranOmsetValueRp = isSurplus ? Math.round(weightDifferenceKg * tbsPricePerKg) : 0;
  const groupFeeTotalRp = Math.round(tphWeightKg * groupFeePerKg);
  const totalGroupOmsetRp = medaranOmsetValueRp + groupFeeTotalRp;

  // Farmers Gross & Net
  const farmersNetPayoutRp = Math.round(tphWeightKg * (tbsPricePerKg - groupFeePerKg));
  const bjrKg = bunchCount > 0 ? (tphWeightKg / bunchCount).toFixed(1) : '0';

  // Preset load
  const loadPreset = (tph: number, gross: number, tare: number, price: number) => {
    setTphWeightKg(tph);
    setFactoryGrossKg(gross);
    setFactoryTareKg(tare);
    setTbsPricePerKg(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="h-6 w-6 text-emerald-600" />
          Kalkulator Simulasi Selisih Medaran & Omset Kelompok
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Hitung cepat selisih timbangan TPH kebun vs timbangan pabrik PKS dan proyeksi omset kelompok tani Bunga Sari
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Simulasi Cepat:</span>
        <button
          type="button"
          onClick={() => loadPreset(12000, 20200, 7800, 2900)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          Muatan Standar (12 Ton)
        </button>
        <button
          type="button"
          onClick={() => loadPreset(14000, 22500, 7720, 2950)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          Muatan Penuh (14 Ton)
        </button>
        <button
          type="button"
          onClick={() => loadPreset(16500, 25200, 7900, 3050)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          Panen Raya (16.5 Ton - TBS Rp 3.050)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* TPH Kebun Section */}
          <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-xs dark:border-sky-900/40 dark:bg-slate-900">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-sky-800 dark:text-sky-300 font-bold text-sm">
              <Scale className="h-5 w-5" /> 1. Timbangan di Kebun (TPH Petani)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Timbangan Seluruh Petani (Kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tphWeightKg}
                    onChange={e => setTphWeightKg(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">Kg</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Janjang TBS
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={bunchCount}
                    onChange={e => setBunchCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">Jjg</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  BJR (Berat Janjang Rata-rata): <strong>{bjrKg} Kg / Janjang</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Pabrik PKS Section */}
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs dark:border-emerald-900/40 dark:bg-slate-900">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <Factory className="h-5 w-5" /> 2. Timbangan Pabrik Kelapa Sawit (PKS)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bruto Truk (Kg)
                </label>
                <input
                  type="number"
                  value={factoryGrossKg}
                  onChange={e => setFactoryGrossKg(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">Netto Akhir Pabrik:</span>
              <span className="font-extrabold text-emerald-800 dark:text-emerald-200 text-sm">
                {formatKg(factoryFinalNetKg)} (Potongan {sortirKg} Kg)
              </span>
            </div>
          </div>

          {/* Pricing & Fee Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Harga TBS Hari Ini (Rp / Kg)
                </label>
                <input
                  type="number"
                  value={tbsPricePerKg}
                  onChange={e => setTbsPricePerKg(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold text-emerald-600 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
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
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold text-sky-600 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-sky-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Omset Card */}
          <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                PROYEKSI OMSET KELOMPOK TANI
              </span>
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>

            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">
                {formatRupiah(totalGroupOmsetRp)}
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Total omset yang masuk ke kas Poktan Bunga Sari dari panen ini
              </p>
            </div>

            {/* Breakdown Components */}
            <div className="mt-6 space-y-2.5 rounded-xl bg-white/10 backdrop-blur-xs p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-emerald-100">1. Nilai Selisih Medaran Lebih:</span>
                <span className="font-bold text-white">{formatRupiah(medaranOmsetValueRp)}</span>
              </div>
              <div className="text-[11px] text-emerald-200">
                ({weightDifferenceKg >= 0 ? `+${weightDifferenceKg}` : weightDifferenceKg} Kg x {formatRupiah(tbsPricePerKg)})
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-emerald-100">2. Iuran Kas Poktan:</span>
                <span className="font-bold text-white">{formatRupiah(groupFeeTotalRp)}</span>
              </div>
              <div className="text-[11px] text-emerald-200">
                ({formatNumber(tphWeightKg)} Kg x Rp {groupFeePerKg})
              </div>
            </div>
          </div>

          {/* Selisih Timbangan Comparison Gauge Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Perbandingan Selisih Medaran
            </h4>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900">
                <span className="text-[11px] text-slate-500 block">Kebun (TPH)</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {formatKg(tphWeightKg)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                <span className="text-[11px] text-slate-500 block">Pabrik (PKS)</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {formatKg(factoryFinalNetKg)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 text-center">
              <span className="text-xs text-slate-500 block">Status Selisih Medaran:</span>
              <div className={`text-xl font-black mt-0.5 ${isSurplus ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isSurplus ? `+${weightDifferenceKg} Kg (Surplus Medaran Lebih)` : `${weightDifferenceKg} Kg (Susut)`}
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Persentase: {differencePercentage.toFixed(2)}%
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Hak Bersih Petani:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatRupiah(farmersNetPayoutRp)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
