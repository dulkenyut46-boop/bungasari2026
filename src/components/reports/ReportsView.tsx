import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatKg, formatDate, downloadCSV, formatNumber } from '../../lib/utils';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  TrendingUp,
  Scale,
  Factory,
  Coins,
  Award,
  BarChart2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { harvestBatches, farmers, metrics } = useApp();
  const [timePeriod, setTimePeriod] = useState<'all' | 'q1_2026' | 'feb_2026' | 'mar_2026'>('all');

  // Filter batches according to selected period
  const filteredBatches = useMemo(() => {
    return harvestBatches.filter(b => {
      if (timePeriod === 'mar_2026') {
        return b.harvestDate.startsWith('2026-03');
      }
      if (timePeriod === 'feb_2026') {
        return b.harvestDate.startsWith('2026-02');
      }
      return true;
    });
  }, [harvestBatches, timePeriod]);

  // Aggregate metrics
  const reportTotals = useMemo(() => {
    let tphKg = 0;
    let pksKg = 0;
    let diffKg = 0;
    let medaranRp = 0;
    let kasRp = 0;
    let omsetRp = 0;
    let farmerPayoutRp = 0;
    let totalBunches = 0;

    filteredBatches.forEach(b => {
      tphKg += b.totalTphWeightKg;
      pksKg += b.factoryFinalNetKg;
      diffKg += b.weightDifferenceKg;
      medaranRp += b.medaranOmsetValueRp;
      kasRp += b.groupFeeTotalRp;
      omsetRp += b.totalGroupOmsetRp;
      farmerPayoutRp += b.totalFarmerPayoutRp;
      totalBunches += b.totalBunches || 0;
    });

    const avgBjr = totalBunches > 0 ? (tphKg / totalBunches).toFixed(1) : '0';
    const medaranRate = tphKg > 0 ? ((diffKg / tphKg) * 100).toFixed(2) : '0';

    return {
      tphKg,
      pksKg,
      diffKg,
      medaranRp,
      kasRp,
      omsetRp,
      farmerPayoutRp,
      totalBunches,
      avgBjr,
      medaranRate,
      batchCount: filteredBatches.length,
    };
  }, [filteredBatches]);

  // Chart data per batch
  const chartData = useMemo(() => {
    return filteredBatches.map(b => ({
      name: b.batchNumber.split('/').pop() ? `Panen #${b.batchNumber.split('/').pop()}` : b.batchNumber,
      'TPH Kebun (Kg)': b.totalTphWeightKg,
      'PKS Pabrik (Kg)': b.factoryFinalNetKg,
      'Selisih (Kg)': b.weightDifferenceKg,
      'Omset (Rp)': b.totalGroupOmsetRp,
    }));
  }, [filteredBatches]);

  // Top Farmer contributors in this period
  const topFarmers = useMemo(() => {
    const map: Record<string, { name: string; code: string; kg: number; shareRp: number }> = {};
    farmers.forEach(f => {
      map[f.id] = { name: f.name, code: f.code, kg: 0, shareRp: 0 };
    });

    filteredBatches.forEach(b => {
      b.items.forEach(i => {
        if (map[i.farmerId]) {
          map[i.farmerId].kg += i.tphWeightKg;
          map[i.farmerId].shareRp += i.farmerShareRp;
        }
      });
    });

    return Object.values(map)
      .sort((a, b) => b.kg - a.kg)
      .slice(0, 5);
  }, [farmers, filteredBatches]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'No Batch',
      'Tanggal',
      'TPH Kebun (Kg)',
      'Netto PKS (Kg)',
      'Selisih Medaran (Kg)',
      'Omset Medaran (Rp)',
      'Iuran Kas (Rp)',
      'Total Omset Kelompok (Rp)',
      'Hak Petani (Rp)',
    ];

    const rows = filteredBatches.map(b => [
      b.batchNumber,
      b.harvestDate,
      b.totalTphWeightKg,
      b.factoryFinalNetKg,
      b.weightDifferenceKg,
      b.medaranOmsetValueRp,
      b.groupFeeTotalRp,
      b.totalGroupOmsetRp,
      b.totalFarmerPayoutRp,
    ]);

    downloadCSV(`LAPORAN_HASIL_PANEN_BUNGA_SARI_${timePeriod}`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Header Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />
            Laporan Kinerja Panen & Omset Kelompok Tani
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ringkasan evaluasi komprehensif selisih medaran lebih dan pertumbuhan omset kas Poktan Bunga Sari
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timePeriod}
            onChange={e => setTimePeriod(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Semua Periode (Q1 2026)</option>
            <option value="mar_2026">Maret 2026</option>
            <option value="feb_2026">Februari 2026</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Printer className="h-4 w-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Tonase TPH Kebun
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatKg(reportTotals.tphKg)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {reportTotals.totalBunches} Janjang (BJR {reportTotals.avgBjr} Kg)
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Netto Pabrik PKS
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatKg(reportTotals.pksKg)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {reportTotals.batchCount} Pengiriman SPB
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4.5 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Total Medaran Lebih
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            +{formatKg(reportTotals.diffKg)}
          </div>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1 block">
            Nilai: {formatRupiah(reportTotals.medaranRp)}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-300 bg-emerald-600 p-4.5 text-white shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
            Total Omset Kelompok Tani
          </span>
          <div className="text-xl font-black mt-1">
            {formatRupiah(reportTotals.omsetRp)}
          </div>
          <span className="text-xs text-emerald-100 mt-1 block">
            Iuran Kas: {formatRupiah(reportTotals.kasRp)}
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Grafik Perbandingan Tonase TPH Kebun vs PKS per Sesi Panen
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    typeof value === 'number' ? formatNumber(value) : value,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="TPH Kebun (Kg)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PKS Pabrik (Kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Farmers in Period (1 col) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Peringkat Hasil Panen Petani
              </h4>
              <Award className="h-4 w-4 text-amber-500" />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topFarmers.map((f, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{f.code}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {formatKg(f.kg)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {formatRupiah(f.shareRp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Total hak bersih tersalurkan ke 20 petani: <strong className="text-slate-900 dark:text-white">{formatRupiah(reportTotals.farmerPayoutRp)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
