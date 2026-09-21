import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  Scale,
  Factory,
  TrendingUp,
  Wallet,
  Users,
  Coins,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Calendar
} from 'lucide-react';
import { formatRupiah, formatKg, formatDate, formatNumber } from '../../lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { HarvestBatch, Farmer } from '../../types';
import { DashboardFarmersSidebar } from './DashboardFarmersSidebar';

interface DashboardViewProps {
  onSelectBatch: (batch: HarvestBatch) => void;
  onOpenNewBatchModal: () => void;
  onViewSlip?: (farmer: Farmer) => void;
  onOpenNewFarmer?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectBatch,
  onOpenNewBatchModal,
  onViewSlip,
  onOpenNewFarmer,
}) => {
  const { metrics, harvestBatches, currentUser, setActiveTab, farmers } = useApp();

  // Data for Area Chart: Comparison of TPH vs Factory Net over time
  const timelineChartData = useMemo(() => {
    return [...harvestBatches]
      .sort((a, b) => new Date(a.harvestDate).getTime() - new Date(b.harvestDate).getTime())
      .map(b => ({
        name: b.batchNumber.replace('BS/PANEN/', 'Manen '),
        date: formatDate(b.harvestDate),
        tphKg: b.totalTphWeightKg,
        pabrikKg: b.factoryFinalNetKg,
        selisihKg: b.weightDifferenceKg,
        omsetRp: b.medaranOmsetValueRp,
      }));
  }, [harvestBatches]);

  // Data for Bar Chart: Top Farmers by production weight
  const topFarmersData = useMemo(() => {
    const farmerTotals: Record<string, { name: string; totalKg: number; bunches: number }> = {};
    harvestBatches.forEach(b => {
      b.items.forEach(item => {
        if (!farmerTotals[item.farmerId]) {
          farmerTotals[item.farmerId] = {
            name: item.farmerName,
            totalKg: 0,
            bunches: 0,
          };
        }
        farmerTotals[item.farmerId].totalKg += item.tphWeightKg;
        farmerTotals[item.farmerId].bunches += item.bunchCount || 0;
      });
    });

    return Object.values(farmerTotals)
      .sort((a, b) => b.totalKg - a.totalKg)
      .slice(0, 6)
      .map(f => ({
        name: f.name.split(' ')[0] + ' ' + (f.name.split(' ')[1] ? f.name.split(' ')[1].charAt(0) + '.' : ''),
        fullName: f.name,
        totalKg: f.totalKg,
        bunches: f.bunches,
      }));
  }, [harvestBatches]);

  // Data for Donut Chart: Financial allocation of total harvest turnover
  const financialDistributionData = useMemo(() => {
    return [
      { name: 'Hak Bersih Petani', value: metrics.totalFarmerPayoutRp, color: '#10B981' }, // Emerald
      { name: 'Omset Medaran Lebih', value: metrics.totalMedaranOmsetRp, color: '#059669' }, // Darker emerald
      { name: 'Iuran Kas Poktan', value: metrics.totalGroupFeeRp, color: '#0284C7' }, // Sky
      { name: 'Biaya Angkut & Muat', value: Math.round(metrics.totalTphKg * 200), color: '#F59E0B' }, // Amber
    ];
  }, [metrics]);

  const recentBatches = harvestBatches.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-xs text-emerald-100">
              <span>Kelompok Tani Bunga Sari</span>
              <span>•</span>
              <span>20 Anggota Petani</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Sistem Rekapitulasi & Selisih Panen Sawit
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl">
              Mempermudah pencatatan hasil timbangan kebun (TPH) vs timbangan pabrik (PKS), menghitung medaran lebih untuk omset kelompok tani, dan transparansi hak petani.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentUser.role === 'admin' ? (
              <button
                onClick={onOpenNewBatchModal}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 focus:outline-none transition-colors cursor-pointer"
              >
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Catat Panen Baru
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('petani')}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 focus:outline-none transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                Lihat Slip Panen Saya
              </button>
            )}
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total TPH Kebun */}
        <StatCard
          title="Timbangan Kebun (TPH)"
          value={formatKg(metrics.totalTphKg)}
          subtitle={`${formatNumber(metrics.totalBunches)} Janjang TBS`}
          icon={Scale}
          variant="emerald"
          badge="Kebun"
        />

        {/* Total Pabrik PKS */}
        <StatCard
          title="Timbangan Pabrik (PKS)"
          value={formatKg(metrics.totalFactoryKg)}
          subtitle="Netto setelah sortir pabrik"
          icon={Factory}
          variant="blue"
          badge="Pabrik"
        />

        {/* Selisih Medaran Lebih */}
        <StatCard
          title="Selisih Medaran Lebih"
          value={`+${formatKg(metrics.totalMedaranDiffKg)}`}
          subtitle={`Rata-rata surplus +${metrics.medaranSurplusPercentage.toFixed(2)}%`}
          icon={TrendingUp}
          variant="emerald"
          trend={{
            value: `+${metrics.medaranSurplusPercentage.toFixed(1)}%`,
            isPositive: true,
            label: 'Surplus timbangan',
          }}
        />

        {/* Omset Kelompok Tani */}
        <StatCard
          title="Total Omset Kelompok"
          value={formatRupiah(metrics.totalGroupOmsetRp)}
          subtitle={`Medaran (${formatRupiah(metrics.totalMedaranOmsetRp)}) + Iuran`}
          icon={Wallet}
          variant="amber"
          badge="Omset Poktan"
        />
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Hak Petani</span>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
            {formatRupiah(metrics.totalFarmerPayoutRp)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Harga TBS Rata-rata</span>
          <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
            {formatRupiah(metrics.averagePricePerKg)} / Kg
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kas Bersih Kelompok</span>
          <div className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 truncate">
            {formatRupiah(metrics.kasBalanceRp)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Anggota Petani Aktif</span>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
            {metrics.activeFarmersCount} Orang ({metrics.totalLandAreaHa} Ha)
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout: Left Content (8 cols) & Right Farmers Sidebar (4 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (8 cols): Charts & Tables */}
        <div className="lg:col-span-8 space-y-6">
          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Left 7 Cols on XL: Timeline Area Chart (TPH vs Pabrik) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 xl:col-span-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Tren Timbangan: Kebun (TPH) vs Pabrik (PKS)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualisasi perbandingan tonase dan stabilitas selisih medaran lebih
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Pabrik (PKS)
              </span>
              <span className="inline-flex items-center gap-1.5 text-sky-600">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Kebun (TPH)
              </span>
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pabrikGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="tphGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} stroke="#94A3B8" />
                <Tooltip
                  formatter={(val: any) => [`${formatNumber(Number(val) || 0)} Kg`, '']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pabrikKg"
                  name="Timbangan Pabrik (Kg)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#pabrikGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="tphKg"
                  name="Timbangan Kebun TPH (Kg)"
                  stroke="#0284C7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#tphGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col on XL: Donut Financial Allocation */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 xl:col-span-5">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Alokasi Perputaran Nilai
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribusi perputaran omset hasil panen TBS
            </p>
          </div>

          <div className="mt-2 h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financialDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {financialDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2">
            {financialDistributionData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatRupiah(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Farmers Bar Chart */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Peringkat Produksi Petani (Top Anggota)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total hasil panen yang disetor anggota ke TPH Kelompok Tani Bunga Sari
            </p>
          </div>
          <button
            onClick={() => setActiveTab('petani')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua 20 Petani <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topFarmersData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} stroke="#94A3B8" />
              <Tooltip
                formatter={(val: any) => [`${formatNumber(Number(val) || 0)} Kg`, 'Total Panen TPH']}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Bar dataKey="totalKg" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Manen / Batches Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Rekapitulasi Panen Terakhir (TPH vs Pabrik)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rincian selisih timbangan medaran dan perolehan omset kelompok
            </p>
          </div>
          <button
            onClick={() => setActiveTab('panen')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua Panen <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-y border-slate-200/60 dark:border-slate-700/60">
              <tr>
                <th className="py-3 px-3">No. Batch / SPB</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Truk / PKS</th>
                <th className="py-3 px-3 text-right">TPH Kebun</th>
                <th className="py-3 px-3 text-right">PKS Pabrik</th>
                <th className="py-3 px-3 text-right">Selisih (Medaran)</th>
                <th className="py-3 px-3 text-right">Omset Kelompok</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentBatches.map(batch => (
                <tr
                  key={batch.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {batch.batchNumber}
                    </span>
                    <span className="text-[11px] text-slate-400">{batch.spbNumber}</span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {formatDate(batch.harvestDate)}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {batch.truckPlate}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px] block">
                      {batch.factoryDestination}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold">
                    {formatKg(batch.totalTphWeightKg)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-slate-900 dark:text-white">
                    {formatKg(batch.factoryFinalNetKg)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <Badge variant={batch.weightDifferenceKg >= 0 ? 'success' : 'danger'}>
                      {batch.weightDifferenceKg >= 0 ? `+${batch.weightDifferenceKg} Kg` : `${batch.weightDifferenceKg} Kg`}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(batch.totalGroupOmsetRp)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => onSelectBatch(batch)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-600" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Right Column: Samping Sebelah Kanan (Daftar Nama Petani) */}
    <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
      <DashboardFarmersSidebar
        farmers={farmers}
        harvestBatches={harvestBatches}
        onViewSlip={onViewSlip}
        onOpenNewFarmer={onOpenNewFarmer}
      />
    </div>
  </div>
</div>
);
};
