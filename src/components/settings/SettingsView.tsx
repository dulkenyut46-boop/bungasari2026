import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, RolePermissionItem } from '../../types';
import { formatDate } from '../../lib/utils';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Database,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Save,
  Users,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  Activity,
  FileSpreadsheet,
  Check,
  X,
  Server,
  Info
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    adminSettings,
    updateAdminSettings,
    farmers,
    harvestBatches,
    financeTransactions,
    restoreFullDatabase,
    resetToDemoData,
    lastBackupDate,
    recordBackupDate,
    showToast,
    switchRole,
  } = useApp();

  // Active sub-tab: 'admin' | 'roles' | 'database'
  const [activeSubTab, setActiveSubTab] = useState<'admin' | 'roles' | 'database'>('admin');

  // Form states for Admin Profile with fallbacks
  const [adminName, setAdminName] = useState(adminSettings?.adminName || 'H. Sudarsono');
  const [adminPosition, setAdminPosition] = useState(adminSettings?.adminPosition || 'Ketua Kelompok Tani');
  const [adminEmail, setAdminEmail] = useState(adminSettings?.adminEmail || 'admin@bungasari.id');
  const [adminPhone, setAdminPhone] = useState(adminSettings?.adminPhone || '0812-3456-7890');
  const [orgName, setOrgName] = useState(adminSettings?.organizationName || 'Kelompok Tani Bunga Sari');
  const [securityPin, setSecurityPin] = useState(adminSettings?.securityPin || '123456');
  const [showPin, setShowPin] = useState(false);
  const [requirePinForDelete, setRequirePinForDelete] = useState(adminSettings?.requirePinForDelete ?? true);

  // Restore DB state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restorePreview, setRestorePreview] = useState<{
    fileData: any;
    fileName: string;
    counts: { farmers: number; batches: number; transactions: number };
    backupTimestamp?: string;
  } | null>(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [confirmPinInput, setConfirmPinInput] = useState('');

  // Storage Stats calculation
  const storageEstimates = React.useMemo(() => {
    try {
      const safeFarmers = farmers || [];
      const safeBatches = harvestBatches || [];
      const safeFinance = financeTransactions || [];
      const rawFarmers = JSON.stringify(safeFarmers);
      const rawBatches = JSON.stringify(safeBatches);
      const rawFinance = JSON.stringify(safeFinance);
      const rawAdmin = JSON.stringify(adminSettings || {});
      const totalBytes = new Blob([rawFarmers, rawBatches, rawFinance, rawAdmin]).size;
      const totalKb = (totalBytes / 1024).toFixed(1);
      const quotaKb = 5120; // Standard 5MB local storage quota
      const usagePercentage = Math.min(100, Math.max(0.5, (totalBytes / (quotaKb * 1024)) * 100));

      return {
        totalBytes,
        totalKb,
        usagePercentage: usagePercentage.toFixed(2),
        entityCounts: {
          farmers: safeFarmers.length,
          batches: safeBatches.length,
          transactions: safeFinance.length,
          total: safeFarmers.length + safeBatches.length + safeFinance.length,
        }
      };
    } catch {
      const safeFarmers = farmers || [];
      const safeBatches = harvestBatches || [];
      const safeFinance = financeTransactions || [];
      return {
        totalBytes: 0,
        totalKb: '0',
        usagePercentage: '0.1',
        entityCounts: {
          farmers: safeFarmers.length,
          batches: safeBatches.length,
          transactions: safeFinance.length,
          total: safeFarmers.length + safeBatches.length + safeFinance.length,
        }
      };
    }
  }, [farmers, harvestBatches, financeTransactions, adminSettings]);

  // Handle Save Admin Settings
  const handleSaveAdminSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      showToast('Nama admin tidak boleh kosong', 'error');
      return;
    }
    if (!securityPin || securityPin.length < 4) {
      showToast('PIN keamanan minimal 4 digit angka', 'error');
      return;
    }

    updateAdminSettings({
      adminName: adminName.trim(),
      adminPosition: adminPosition.trim(),
      adminEmail: adminEmail.trim(),
      adminPhone: adminPhone.trim(),
      organizationName: orgName.trim(),
      securityPin: securityPin.trim(),
      requirePinForDelete,
    });
  };

  // Handle Backup / Export JSON
  const handleExportDatabase = () => {
    try {
      const backupPayload = {
        application: 'Sistem Pencatatan Hasil Panen Kelompok Tani Bunga Sari',
        version: '2.5.0',
        cluster: 'Bunga Sari - Bagan Sinembah / Rokan Hilir',
        exportDate: new Date().toISOString(),
        exportedBy: adminName,
        totalRecords: {
          farmers: farmers.length,
          harvestBatches: harvestBatches.length,
          financeTransactions: financeTransactions.length,
        },
        adminSettings: {
          adminName,
          adminPosition,
          adminEmail,
          adminPhone,
          organizationName: orgName,
          requirePinForDelete,
        },
        farmers,
        harvestBatches,
        financeTransactions,
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `backup_poktan_bunga_sari_${dateStr}_${timeStr}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      recordBackupDate();
      showToast(`Cadangan database berhasil diunduh (${fileName})`, 'success');
    } catch (err: any) {
      showToast(`Gagal mengekspor database: ${err.message}`, 'error');
    }
  };

  // Handle File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('Harap pilih file dengan format .json', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const farmersList = Array.isArray(parsed.farmers) ? parsed.farmers : [];
        const batchesList = Array.isArray(parsed.harvestBatches) ? parsed.harvestBatches : [];
        const financeList = Array.isArray(parsed.financeTransactions) ? parsed.financeTransactions : [];

        if (farmersList.length === 0 && batchesList.length === 0 && financeList.length === 0) {
          showToast('File JSON tidak memuat data kelompok tani yang valid', 'error');
          return;
        }

        setRestorePreview({
          fileData: parsed,
          fileName: file.name,
          counts: {
            farmers: farmersList.length,
            batches: batchesList.length,
            transactions: financeList.length,
          },
          backupTimestamp: parsed.exportDate,
        });
        setIsConfirmRestoreOpen(true);
      } catch {
        showToast('Gagal membaca file JSON. Format file tidak valid atau rusak.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Execute Restore
  const handleExecuteRestore = () => {
    if (!restorePreview) return;
    const res = restoreFullDatabase(restorePreview.fileData);
    if (res.success) {
      setIsConfirmRestoreOpen(false);
      setRestorePreview(null);
    }
  };

  // Handle Reset to Demo
  const handleExecuteReset = () => {
    const activePin = adminSettings?.securityPin || securityPin || '123456';
    if (adminSettings?.requirePinForDelete && confirmPinInput !== activePin) {
      showToast('PIN keamanan salah! Reset dibatalkan.', 'error');
      return;
    }
    resetToDemoData();
    setIsResetConfirmOpen(false);
    setConfirmPinInput('');
  };

  // Roles definition matrix
  const rolePermissionsList: RolePermissionItem[] = [
    {
      id: 'super-admin',
      role: 'admin',
      label: 'Super Admin (Ketua Poktan)',
      description: 'Akses penuh tanpa batas ke seluruh data panen, master 20 petani, pembagian kas, dan database.',
      userCount: 1,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      canInputHarvest: true,
      canEditHarvest: true,
      canDeleteHarvest: true,
      canManageFarmers: true,
      canViewFinance: true,
      canManageFinance: true,
      canDownloadReports: true,
      canManageSettings: true,
      canBackupDatabase: true,
    },
    {
      id: 'bendahara',
      role: 'bendahara',
      label: 'Bendahara Poktan',
      description: 'Akses pembukuan kas kelompok, omset selisih medaran, verifikasi pembayaran petani, dan cetak slip.',
      userCount: 1,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      canInputHarvest: true,
      canEditHarvest: false,
      canDeleteHarvest: false,
      canManageFarmers: false,
      canViewFinance: true,
      canManageFinance: true,
      canDownloadReports: true,
      canManageSettings: false,
      canBackupDatabase: true,
    },
    {
      id: 'mandor',
      role: 'mandor',
      label: 'Mandor / Petugas Timbang TPH',
      description: 'Petugas lapangan yang mencatat timbangan TPH kebun dan jumlah janjang saat pemuatan truk.',
      userCount: 2,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      canInputHarvest: true,
      canEditHarvest: true,
      canDeleteHarvest: false,
      canManageFarmers: false,
      canViewFinance: false,
      canManageFinance: false,
      canDownloadReports: false,
      canManageSettings: false,
      canBackupDatabase: false,
    },
    {
      id: 'petani-anggota',
      role: 'petani',
      label: 'Petani Anggota (20 Petani)',
      description: 'Hak akses transparansi melihat slip panen pribadi, riwayat timbangan TPH, dan harga TBS harian.',
      userCount: (farmers || []).length || 20,
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      canInputHarvest: false,
      canEditHarvest: false,
      canDeleteHarvest: false,
      canManageFarmers: false,
      canViewFinance: false,
      canManageFinance: false,
      canDownloadReports: true,
      canManageSettings: false,
      canBackupDatabase: false,
    },
  ];

  return (
    <div id="settings-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Settings className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pengaturan Sistem & Database
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola profil admin poktan, konfigurasi hak akses wewenang pengguna, dan pencadangan database mandiri.
          </p>
        </div>

        {/* Quick Database Status Badge */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {(farmers || []).length} Petani Terdaftar
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 dark:text-slate-400">
              {storageEstimates.totalKb} KB Tersimpan
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('admin')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'admin'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Pengaturan Akun Admin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('roles')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'roles'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Hak Akses & Pengguna</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('database')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'database'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Penyimpanan Database</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: PENGATURAN AKUN ADMIN */}
      {/* ========================================================================= */}
      {activeSubTab === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form Edit Akun */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveAdminSettings} className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Identitas Pengurus Poktan
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Perbarui profil penanggung jawab dan ketua kelompok tani
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  Peran: Super Admin
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Lengkap Admin <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Contoh: H. Sudarsono"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Jabatan Struktural
                    </label>
                    <input
                      type="text"
                      value={adminPosition}
                      onChange={(e) => setAdminPosition(e.target.value)}
                      placeholder="Contoh: Ketua Kelompok Tani"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Akun Resmi
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@bungasari.id"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nomor HP / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="0812-3456-7890"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Kelompok Tani / Organisasi
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Kelompok Tani Bunga Sari"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nama kelompok tani ini digunakan pada cetakan slip panen dan judul laporan resmi.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    Keamanan & Otorisasi Transaksi
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        PIN Keamanan Admin (6 Digit)
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? 'text' : 'password'}
                          maxLength={6}
                          value={securityPin}
                          onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 tracking-wider focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PIN ini digunakan untuk konfirmasi hapus batch panen dan reset database.
                      </p>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requirePinForDelete}
                          onChange={(e) => setRequirePinForDelete(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                            Proteksi Hapus dengan PIN
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                            Wajibkan masukkan PIN keamanan sebelum data panen penting dihapus permanen.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Terakhir diperbarui: {adminSettings.lastUpdated ? formatDate(adminSettings.lastUpdated) : 'Baru saja'}
                </span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Pengaturan Akun</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Card Status Admin & Daftar Pengurus */}
          <div className="space-y-6">
            {/* Profil Ringkas */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-base font-bold text-white shadow-xs">
                  {adminName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {adminName}
                  </h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    {adminPosition}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {orgName}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">{adminEmail}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">No. WhatsApp:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{adminPhone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status Keamanan:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> PIN Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Struktur Pengurus Kelompok */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                <span>Struktur Pengurus Poktan</span>
                <span className="text-[10px] text-slate-400 font-normal">Tahun Buku 2026</span>
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{adminName}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ketua Kelompok (Admin)</div>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Utama
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Bpk. H. Rahmat Hidayat</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Bendahara / Kas Kelompok</div>
                  </div>
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Keuangan
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Agus Supriyanto</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Mandor Timbang TPH & Angkutan</div>
                  </div>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Lapangan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: HAK AKSES & PENGGUNA */}
      {/* ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div className="space-y-6">
          {/* Info Card RBAC */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 sm:p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Pemisahan Hak Wewenang Tata Kelola Poktan (Role-Based Access Control)
                </h4>
                <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
                  Sistem menerapkan pembagian kewenangan yang ketat untuk mencegah manipulasi timbangan TBS, menjaga kerahasiaan pembukuan kas kelompok, dan menjamin transparansi hak hasil panen setiap petani anggota.
                </p>
              </div>
            </div>
          </div>

          {/* Cards Peran Pengguna */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rolePermissionsList.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                      {item.role.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {item.userCount} Pengguna
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Status Akses:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Aktif
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Matriks Wewenang Akses */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Matriks Hak Akses Fitur Aplikasi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daftar izin operasional pada setiap modul sistem
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Standar Kelompok Tani Bunga Sari
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4 font-bold">Modul & Tindakan Fitur</th>
                    <th className="py-3 px-4 font-bold text-center">Super Admin</th>
                    <th className="py-3 px-4 font-bold text-center">Bendahara</th>
                    <th className="py-3 px-4 font-bold text-center">Mandor Timbang</th>
                    <th className="py-3 px-4 font-bold text-center">Petani Anggota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Input Catatan Panen Baru (TPH & PKS)
                    </td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Ubah Data Timbangan & Potongan Sortir
                    </td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Hapus Catatan Panen (Perlu PIN)
                    </td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Kelola Master Data 20 Petani (Tambah/Ubah)
                    </td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Kelola Kas & Omset Medaran Lebih
                    </td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Cetak Slip Panen & Ekspor Excel
                    </td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Pengaturan Sistem & Konfigurasi Akun
                    </td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      Cadangkan & Pulihkan Database
                    </td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quick Switch Role Preview */}
            <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 dark:border-slate-800 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-white">Mode Simulasi Hak Akses:</span> Saat ini Anda sedang mengakses sebagai{' '}
                <span className="font-bold text-emerald-600 uppercase">{currentUser.role}</span>.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => switchRole('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    currentUser.role === 'admin'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Mode Admin
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('petani', 'farmer-1')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    currentUser.role === 'petani'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Mode Petani (Joko S.)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PENYIMPANAN DATABASE */}
      {/* ========================================================================= */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          {/* Storage Capacity Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Engine */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Mesin Database
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Local Storage + JSON Sync
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Beroperasi Normal
              </div>
            </div>

            {/* Card 2: Entity Counts */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Total Rekaman Data
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {storageEstimates.entityCounts.total} Entitas Tersimpan
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {(farmers || []).length} Petani • {(harvestBatches || []).length} Panen • {(financeTransactions || []).length} Kas
              </div>
            </div>

            {/* Card 3: Storage Size */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Ukuran Ruang Memori
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {storageEstimates.totalKb} KB terpakai
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800 mt-2">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${Math.max(1, Number(storageEstimates.usagePercentage))}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Kapasitas kuota aman (tersedia 5,120 KB)
              </div>
            </div>

            {/* Card 4: Last Backup */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Cadangan Terakhir
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {lastBackupDate ? formatDate(lastBackupDate) : 'Belum Pernah'}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Disarankan unduh cadangan tiap akhir panen
              </div>
            </div>
          </div>

          {/* Backup & Restore Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action 1: Export / Cadangkan Database */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Cadangkan Database (Backup JSON)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Unduh seluruh arsip data poktan ke komputer atau smartphone
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 my-4 leading-relaxed">
                  <p>
                    File cadangan memuat seluruh data penting kelompok tani:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                    <li>Daftar lengkap 20 anggota petani beserta nomor rekening & luas lahan</li>
                    <li>Seluruh catatan transaksi panen TPH kebun vs PKS dan selisih medaran</li>
                    <li>Rincian slip hak penerimaan uang setiap petani</li>
                    <li>Buku kas kelompok tani (omset medaran lebih & iuran kas)</li>
                    <li>Konfigurasi dan pengaturan akun pengurus poktan</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleExportDatabase}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Cadangkan Database Sekarang (.JSON)</span>
                </button>
              </div>
            </div>

            {/* Action 2: Restore / Pulihkan Database */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Pulihkan Database (Restore JSON)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Impor kembali file cadangan database yang pernah disimpan
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 my-4 leading-relaxed">
                  <p>
                    Gunakan fitur ini jika berpindah perangkat atau ingin mengembalikan data ke titik waktu tertentu.
                  </p>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Memulihkan data akan menggantikan data yang saat ini aktif dengan isi data dari file cadangan yang dipilih.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-blue-600" />
                  <span>Pilih File Cadangan Database (.JSON)...</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reset / Pemeliharaan Mandiri */}
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-5 shadow-xs dark:border-rose-900/50 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                Zona Pemeliharaan & Reset Data
              </h4>
              <p className="text-xs text-rose-900/70 dark:text-rose-300/70 mt-1 max-w-2xl">
                Kembalikan seluruh database ke data awal demonstrasi Poktan Bunga Sari (20 petani terdaftar & 6 batch panen standar). Aksi ini dilindungi oleh PIN keamanan admin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmPinInput('');
                setIsResetConfirmOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset ke Data Awal Poktan</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: KONFIRMASI RESTORE DATABASE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isConfirmRestoreOpen}
        onClose={() => {
          setIsConfirmRestoreOpen(false);
          setRestorePreview(null);
        }}
        title="Konfirmasi Pemulihan Database"
        subtitle="Verifikasi isi file cadangan sebelum diterapkan ke sistem"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsConfirmRestoreOpen(false);
                setRestorePreview(null);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteRestore}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Terapkan & Pulihkan Sekarang</span>
            </button>
          </div>
        }
      >
        {restorePreview && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama File:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{restorePreview.fileName}</span>
              </div>
              {restorePreview.backupTimestamp && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Cadangan:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(restorePreview.backupTimestamp)}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <h5 className="font-bold text-slate-900 dark:text-white mb-2">
                Data yang Ditemukan dalam File:
              </h5>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/40">
                  <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">{restorePreview.counts.farmers}</div>
                  <div className="text-[10px] text-slate-500">Petani</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/40">
                  <div className="text-base font-bold text-blue-700 dark:text-blue-300">{restorePreview.counts.batches}</div>
                  <div className="text-[10px] text-slate-500">Batch Panen</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/40">
                  <div className="text-base font-bold text-amber-700 dark:text-amber-300">{restorePreview.counts.transactions}</div>
                  <div className="text-[10px] text-slate-500">Transaksi Kas</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Peringatan: Data yang saat ini aktif akan ditimpa dengan rekaman dari file cadangan ini. Pastikan Anda telah membuat cadangan terbaru jika masih memerlukan data lama.
            </p>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: KONFIRMASI RESET DATA AWAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => {
          setIsResetConfirmOpen(false);
          setConfirmPinInput('');
        }}
        title="Reset ke Data Awal Demonstrasi"
        subtitle="Kembalikan master data 20 petani dan data panen standar"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsResetConfirmOpen(false);
                setConfirmPinInput('');
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteReset}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset Sekarang</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            Tindakan ini akan mengatur ulang data petani, batch panen, dan transaksi kas ke 20 petani Bunga Sari standar.
          </div>

          {adminSettings?.requirePinForDelete && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Masukkan PIN Keamanan Admin ({(adminSettings?.securityPin || securityPin || '123456').length} Digit)
              </label>
              <input
                type="password"
                maxLength={6}
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value)}
                placeholder="Masukkan PIN Admin"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono tracking-widest text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                PIN default adalah 123456 jika belum pernah Anda ubah.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
