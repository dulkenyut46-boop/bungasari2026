import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FinanceTransaction } from '../../types';
import { formatRupiah, formatDate, downloadCSV } from '../../lib/utils';
import { Badge } from '../common/Badge';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Download,
  Trash2,
  TrendingUp,
  CreditCard,
  Building,
  Wrench,
  Users
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const FinanceView: React.FC = () => {
  const {
    financeTransactions,
    addFinanceTransaction,
    deleteFinanceTransaction,
    metrics,
    currentUser,
    globalSearch,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');
  const [formCategory, setFormCategory] = useState<FinanceTransaction['category']>('operasional_jalan');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number>(500000);
  const [formDescription, setFormDescription] = useState('');

  const effectiveSearch = globalSearch || searchTerm;

  const filteredTransactions = useMemo(() => {
    return financeTransactions.filter(t => {
      if (effectiveSearch) {
        const q = effectiveSearch.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      return true;
    });
  }, [financeTransactions, effectiveSearch, typeFilter, categoryFilter]);

  // Income vs Expense breakdown
  const financialTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    financeTransactions.forEach(t => {
      if (t.type === 'pemasukan') income += t.amount;
      else expense += t.amount;
    });
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [financeTransactions]);

  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Jenis', 'Kategori', 'Judul Transaksi', 'Jumlah (Rp)', 'Keterangan', 'Dicatat Oleh'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type,
      t.category,
      t.title,
      t.amount,
      t.description,
      t.recordedBy,
    ]);

    downloadCSV(`BUKU_KAS_BUNGA_SARI_${new Date().toISOString().split('T')[0]}`, [
      headers,
      ...rows,
    ]);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    addFinanceTransaction({
      date: formDate,
      type: formType,
      category: formCategory,
      title: formTitle,
      amount: formAmount,
      description: formDescription,
      recordedBy: currentUser.name,
    });
    setIsAddModalOpen(false);
    setFormTitle('');
    setFormDescription('');
  };

  const getCategoryLabel = (category: FinanceTransaction['category']) => {
    switch (category) {
      case 'medaran_lebih':
        return 'Omset Medaran Lebih';
      case 'iuran_kas':
        return 'Iuran Kas Panen';
      case 'operasional_jalan':
        return 'Perbaikan Jalan Kebun';
      case 'alat_panen':
        return 'Peralatan & Timbangan';
      case 'rapat_kelompok':
        return 'Rapat Anggota';
      default:
        return 'Operasional Lainnya';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kas & Omset Kelompok Tani Bunga Sari
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pencatatan omset dari selisih timbangan medaran lebih, iuran kas panen anggota, dan biaya operasional kebun
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4" /> Export Buku Kas
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" /> Catat Kas
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saldo Kas */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              SALDO KAS KELOMPOK TANI
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatRupiah(financialTotals.balance)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Total saldo kas aktif Bunga Sari
          </p>
        </div>

        {/* Total Pemasukan */}
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-5 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              TOTAL PEMASUKAN OMSET & KAS
            </span>
            <div className="rounded-lg bg-emerald-600 p-2 text-white">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
            +{formatRupiah(financialTotals.income)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Dari selisih medaran lebih & iuran panen
          </p>
        </div>

        {/* Total Pengeluaran */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-5 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              TOTAL PENGELUARAN KELOMPOK
            </span>
            <div className="rounded-lg bg-rose-600 p-2 text-white">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-300">
            -{formatRupiah(financialTotals.expense)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Pemeliharaan jalan, jembatan kebun, & rapat
          </p>
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
              placeholder="Cari transaksi kas..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Semua Jenis Transaksi</option>
              <option value="pemasukan">Pemasukan (+)</option>
              <option value="pengeluaran">Pengeluaran (-)</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Semua Kategori</option>
              <option value="medaran_lebih">Omset Medaran Lebih</option>
              <option value="iuran_kas">Iuran Kas Panen</option>
              <option value="operasional_jalan">Perbaikan Jalan Kebun</option>
              <option value="rapat_kelompok">Rapat Anggota</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700/80">
              <tr>
                <th className="py-3 px-3.5">Tanggal</th>
                <th className="py-3 px-3.5">Kategori</th>
                <th className="py-3 px-3.5">Judul & Keterangan</th>
                <th className="py-3 px-3 text-right">Jumlah (Rp)</th>
                <th className="py-3 px-3.5">Dicatat Oleh</th>
                {currentUser.role === 'admin' && (
                  <th className="py-3 px-3 text-center">Hapus</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map(t => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-3.5 font-medium whitespace-nowrap">
                    {formatDate(t.date)}
                  </td>
                  <td className="py-3.5 px-3.5">
                    <Badge variant={t.type === 'pemasukan' ? 'success' : 'danger'}>
                      {getCategoryLabel(t.category)}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {t.title}
                    </span>
                    <span className="text-[11px] text-slate-500 block max-w-md">
                      {t.description}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-extrabold text-sm whitespace-nowrap">
                    <span className={t.type === 'pemasukan' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {t.type === 'pemasukan' ? `+${formatRupiah(t.amount)}` : `-${formatRupiah(t.amount)}`}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-slate-500">
                    {t.recordedBy}
                  </td>
                  {currentUser.role === 'admin' && (
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => deleteFinanceTransaction(t.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Transaction */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Catat Transaksi Kas Kelompok"
        subtitle="Masukkan pengeluaran atau pemasukan baru ke buku kas Poktan Bunga Sari"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateTransaction}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
            >
              Simpan Transaksi
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Transaksi
              </label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="pengeluaran">Pengeluaran (-)</option>
                <option value="pemasukan">Pemasukan (+)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kategori
            </label>
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="operasional_jalan">Perbaikan Jalan / Gorong-gorong</option>
              <option value="alat_panen">Peralatan / Timbangan</option>
              <option value="rapat_kelompok">Rapat Anggota / Konsumsi</option>
              <option value="medaran_lebih">Omset Medaran Lebih</option>
              <option value="iuran_kas">Iuran Kas Panen</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Transaksi *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="Contoh: Pembelian batu sirtu untuk jalan Blok B"
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jumlah Nominal (Rp) *
            </label>
            <input
              type="number"
              required
              value={formAmount}
              onChange={e => setFormAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan Rinci
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Keterangan nota, toko material, atau rincian kegiatan..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
