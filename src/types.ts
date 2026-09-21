export type UserRole = 'admin' | 'petani';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  farmerId?: string; // If role is petani
  avatar?: string;
  phone?: string;
}

export interface Farmer {
  id: string;
  code: string; // e.g. "BS-001"
  name: string;
  nik?: string;
  phone: string;
  landAreaHa: number; // Luas Lahan (Hektar)
  blockLocation: string; // e.g. "Blok A - TPH 1-3"
  plantYear: number; // Tahun Tanam
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  joinedDate: string;
  status: 'aktif' | 'non-aktif';
}

export interface HarvestFarmerDetail {
  farmerId: string;
  farmerName: string;
  bunchCount?: number; // Jumlah Janjang (opsional)
  tphWeightKg: number; // Timbangan di TPH Kebun (Kg)
  tphLocation: string; // TPH 01, TPH 02, etc.
  sortirDeductionKg?: number; // Potongan sortir bila ada
  netTphKg: number; // Netto TPH
  farmerShareRp: number; // Uang yang diterima petani
  groupDeductionRp: number; // Iuran/potongan kas kelompok tani
  notes?: string;
}

export interface HarvestBatch {
  id: string;
  batchNumber: string; // e.g. "PANEN-2026-001" / No SPB
  harvestDate: string; // Tanggal Panen Kebun
  factoryDate: string; // Tanggal Masuk Pabrik / Timbang PKS
  driverName: string;
  truckPlate: string; // No Polisi Truk
  factoryDestination: string; // Nama PKS (e.g. "PKS PT Bunga Sawit Sejahtera")
  spbNumber: string; // Surat Pengantar Buah
  ticketNumberPKS: string; // No Tiket Timbang PKS
  
  // Timbangan Kebun (TPH)
  totalBunches?: number; // Total Janjang (opsional)
  totalTphWeightKg: number; // Total Berat TPH Seluruh Petani (Kg)
  
  // Timbangan Pabrik (PKS)
  factoryGrossKg: number; // Bruto Pabrik
  factoryTareKg: number; // Tarra Truk Kosong
  factoryNetKg: number; // Netto Pabrik
  sortirPercentage: number; // Potongan Sortir Pabrik (%)
  sortirKg: number; // Potongan Sortir dalam Kg
  factoryFinalNetKg: number; // Netto Akhir PKS setelah potongan
  
  // Perhitungan Selisih & Medaran
  weightDifferenceKg: number; // Selisih Medaran = factoryFinalNetKg - totalTphWeightKg
  differenceStatus: 'surplus' | 'susut' | 'imbang'; // Surplus (Medaran lebih), Susut (Kurang)
  
  // Finansial
  tbsPricePerKg: number; // Harga TBS per Kg (Rp)
  medaranOmsetValueRp: number; // Nilai Selisih Medaran Lebih = weightDifferenceKg * tbsPricePerKg (jika positif)
  groupFeePerKg: number; // Iuran Kas Kelompok per Kg (misal Rp 25/kg)
  groupFeeTotalRp: number; // Total Iuran Kas Kelompok dari panen ini
  totalGroupOmsetRp: number; // Total Omset Kelompok (Medaran lebih + Iuran kas)
  
  totalFarmerPayoutRp: number; // Total Pembayaran ke Petani
  transportFeeRp: number; // Biaya Transport/Angkut Truk
  loadingFeeRp: number; // Biaya Muat/Bongkar (Buruh)
  
  status: 'selesai' | 'verifikasi' | 'proses_pabrik';
  notes?: string;
  items: HarvestFarmerDetail[];
}

export interface FinanceTransaction {
  id: string;
  date: string;
  type: 'pemasukan' | 'pengeluaran';
  category: 'medaran_lebih' | 'iuran_kas' | 'operasional_jalan' | 'alat_panen' | 'rapat_kelompok' | 'lainnya';
  title: string;
  amount: number;
  batchReferenceId?: string;
  description: string;
  recordedBy: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'panen'
  | 'petani'
  | 'kalkulator'
  | 'kas_kelompok'
  | 'laporan';
