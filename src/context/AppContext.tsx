import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Farmer, HarvestBatch, FinanceTransaction, UserProfile, ActiveTab, UserRole } from '../types';
import { INITIAL_USERS, INITIAL_FARMERS, INITIAL_HARVEST_BATCHES, INITIAL_FINANCE_TRANSACTIONS } from '../data/initialData';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Auth & Profile
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole, farmerId?: string) => void;
  login: (email: string, role: UserRole, farmerId?: string) => boolean;
  logout: () => void;
  isLoggedIn: boolean;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Data
  farmers: Farmer[];
  harvestBatches: HarvestBatch[];
  financeTransactions: FinanceTransaction[];

  // Farmer CRUD
  addFarmer: (data: Omit<Farmer, 'id'>) => void;
  updateFarmer: (id: string, updates: Partial<Farmer>) => void;
  deleteFarmer: (id: string) => void;

  // Harvest Batch CRUD
  addHarvestBatch: (data: Omit<HarvestBatch, 'id'>) => void;
  updateHarvestBatch: (id: string, updates: Partial<HarvestBatch>) => void;
  deleteHarvestBatch: (id: string) => void;

  // Finance CRUD
  addFinanceTransaction: (data: Omit<FinanceTransaction, 'id'>) => void;
  deleteFinanceTransaction: (id: string) => void;

  // Utilities
  resetToDemoData: () => void;
  toast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Global search
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Computed metrics
  metrics: {
    totalTphKg: number;
    totalFactoryKg: number;
    totalMedaranDiffKg: number;
    medaranSurplusPercentage: number;
    totalMedaranOmsetRp: number;
    totalGroupFeeRp: number;
    totalGroupOmsetRp: number;
    totalFarmerPayoutRp: number;
    averagePricePerKg: number;
    totalBunches: number;
    activeFarmersCount: number;
    totalLandAreaHa: number;
    kasBalanceRp: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'bunga_sari_theme',
  USER: 'bunga_sari_user',
  FARMERS: 'bunga_sari_farmers',
  BATCHES: 'bunga_sari_batches',
  FINANCE: 'bunga_sari_finance',
  LOGGED_IN: 'bunga_sari_auth_state',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light'; // Default to modern clean light (Tokopedia green style)
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Global search
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Toast
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr));
    }, 3500);
  };

  // Auth & Profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_USERS[0]; // Admin by default
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGGED_IN);
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN, String(isLoggedIn));
  }, [isLoggedIn]);

  // Data states
  const [farmers, setFarmers] = useState<Farmer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FARMERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_FARMERS;
  });

  const [harvestBatches, setHarvestBatches] = useState<HarvestBatch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_HARVEST_BATCHES;
  });

  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FINANCE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_FINANCE_TRANSACTIONS;
  });

  // Sync back to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(farmers));
  }, [farmers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(harvestBatches));
  }, [harvestBatches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(financeTransactions));
  }, [financeTransactions]);

  // Role switching
  const switchRole = (role: UserRole, farmerId?: string) => {
    if (role === 'admin') {
      setCurrentUser(INITIAL_USERS[0]);
      showToast('Beralih ke mode Pengurus / Admin', 'info');
    } else {
      const selectedFarmer = farmers.find(f => f.id === farmerId) || farmers[0];
      setCurrentUser({
        id: `user-${selectedFarmer.id}`,
        name: selectedFarmer.name,
        role: 'petani',
        email: `${selectedFarmer.name.toLowerCase().replace(/\s+/g, '')}@petani.id`,
        farmerId: selectedFarmer.id,
        phone: selectedFarmer.phone,
      });
      showToast(`Beralih ke tampilan Petani: ${selectedFarmer.name}`, 'info');
    }
  };

  const login = (email: string, role: UserRole, farmerId?: string) => {
    setIsLoggedIn(true);
    if (role === 'admin') {
      setCurrentUser({
        id: 'user-admin',
        name: 'H. Sudarsono (Ketua Poktan)',
        role: 'admin',
        email: email || 'admin@bungasari.id',
        phone: '0812-3456-7890',
      });
    } else {
      const targetFarmer = farmers.find(f => f.id === farmerId) || farmers[0];
      setCurrentUser({
        id: `user-${targetFarmer.id}`,
        name: targetFarmer.name,
        role: 'petani',
        email: email || `${targetFarmer.name.toLowerCase().replace(/\s+/g, '')}@petani.id`,
        farmerId: targetFarmer.id,
        phone: targetFarmer.phone,
      });
    }
    showToast('Berhasil masuk ke aplikasi Bunga Sari', 'success');
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    showToast('Anda telah keluar dari aplikasi', 'info');
  };

  // Farmer CRUD
  const addFarmer = (data: Omit<Farmer, 'id'>) => {
    const newId = `farmer-${Date.now()}`;
    const newFarmer: Farmer = {
      ...data,
      id: newId,
    };
    setFarmers(prev => [newFarmer, ...prev]);
    showToast(`Petani ${newFarmer.name} berhasil ditambahkan!`, 'success');
  };

  const updateFarmer = (id: string, updates: Partial<Farmer>) => {
    setFarmers(prev =>
      prev.map(f => (f.id === id ? { ...f, ...updates } : f))
    );
    showToast('Data petani berhasil diperbarui', 'success');
  };

  const deleteFarmer = (id: string) => {
    const target = farmers.find(f => f.id === id);
    setFarmers(prev => prev.filter(f => f.id !== id));
    showToast(`Data petani ${target?.name || ''} telah dihapus`, 'info');
  };

  // Harvest Batch CRUD
  const addHarvestBatch = (data: Omit<HarvestBatch, 'id'>) => {
    const newId = `batch-${Date.now()}`;
    const newBatch: HarvestBatch = {
      ...data,
      id: newId,
    };
    setHarvestBatches(prev => [newBatch, ...prev]);

    // Automatically record omset medaran & kas into finance transactions
    if (newBatch.medaranOmsetValueRp > 0) {
      const trxMedaran: FinanceTransaction = {
        id: `trx-${Date.now()}-1`,
        date: newBatch.harvestDate,
        type: 'pemasukan',
        category: 'medaran_lebih',
        title: `Omset Medaran Lebih (${newBatch.batchNumber})`,
        amount: newBatch.medaranOmsetValueRp,
        batchReferenceId: newId,
        description: `Surplus ${newBatch.weightDifferenceKg} kg x ${newBatch.tbsPricePerKg}/kg PKS`,
        recordedBy: currentUser.name,
      };
      setFinanceTransactions(prev => [trxMedaran, ...prev]);
    }

    if (newBatch.groupFeeTotalRp > 0) {
      const trxKas: FinanceTransaction = {
        id: `trx-${Date.now()}-2`,
        date: newBatch.harvestDate,
        type: 'pemasukan',
        category: 'iuran_kas',
        title: `Iuran Kas Kelompok (${newBatch.batchNumber})`,
        amount: newBatch.groupFeeTotalRp,
        batchReferenceId: newId,
        description: `Iuran kas Rp ${newBatch.groupFeePerKg}/kg dari ${newBatch.totalTphWeightKg} kg TPH`,
        recordedBy: currentUser.name,
      };
      setFinanceTransactions(prev => [trxKas, ...prev]);
    }

    showToast(`Rekapan panen ${newBatch.batchNumber} berhasil disimpan!`, 'success');
  };

  const updateHarvestBatch = (id: string, updates: Partial<HarvestBatch>) => {
    setHarvestBatches(prev =>
      prev.map(b => (b.id === id ? { ...b, ...updates } : b))
    );
    showToast('Catatan panen berhasil diperbarui', 'success');
  };

  const deleteHarvestBatch = (id: string) => {
    const target = harvestBatches.find(b => b.id === id);
    setHarvestBatches(prev => prev.filter(b => b.id !== id));
    // Remove linked finance transactions
    setFinanceTransactions(prev => prev.filter(t => t.batchReferenceId !== id));
    showToast(`Catatan panen ${target?.batchNumber || ''} dihapus`, 'info');
  };

  // Finance Transactions CRUD
  const addFinanceTransaction = (data: Omit<FinanceTransaction, 'id'>) => {
    const newId = `trx-${Date.now()}`;
    const newTrx: FinanceTransaction = {
      ...data,
      id: newId,
    };
    setFinanceTransactions(prev => [newTrx, ...prev]);
    showToast('Transaksi kas kelompok berhasil dicatat', 'success');
  };

  const deleteFinanceTransaction = (id: string) => {
    setFinanceTransactions(prev => prev.filter(t => t.id !== id));
    showToast('Transaksi kas berhasil dihapus', 'info');
  };

  // Reset to initial demo data
  const resetToDemoData = () => {
    setFarmers(INITIAL_FARMERS);
    setHarvestBatches(INITIAL_HARVEST_BATCHES);
    setFinanceTransactions(INITIAL_FINANCE_TRANSACTIONS);
    setCurrentUser(INITIAL_USERS[0]);
    showToast('Data dikembalikan ke data awal demonstrasi', 'info');
  };

  // Computed metrics
  const metrics = useMemo(() => {
    let totalTphKg = 0;
    let totalFactoryKg = 0;
    let totalMedaranOmsetRp = 0;
    let totalGroupFeeRp = 0;
    let totalGroupOmsetRp = 0;
    let totalFarmerPayoutRp = 0;
    let totalBunches = 0;
    let totalPriceSum = 0;

    harvestBatches.forEach(b => {
      totalTphKg += b.totalTphWeightKg || 0;
      totalFactoryKg += b.factoryFinalNetKg || 0;
      totalMedaranOmsetRp += b.medaranOmsetValueRp || 0;
      totalGroupFeeRp += b.groupFeeTotalRp || 0;
      totalGroupOmsetRp += b.totalGroupOmsetRp || 0;
      totalFarmerPayoutRp += b.totalFarmerPayoutRp || 0;
      totalBunches += b.totalBunches || 0;
      totalPriceSum += (b.tbsPricePerKg || 0);
    });

    const totalMedaranDiffKg = totalFactoryKg - totalTphKg;
    const medaranSurplusPercentage = totalTphKg > 0 ? (totalMedaranDiffKg / totalTphKg) * 100 : 0;
    const averagePricePerKg = harvestBatches.length > 0 ? Math.round(totalPriceSum / harvestBatches.length) : 2900;

    const activeFarmersCount = farmers.filter(f => f.status === 'aktif').length;
    const totalLandAreaHa = farmers.reduce((sum, f) => sum + (f.landAreaHa || 0), 0);

    // Kas Balance: sum(pemasukan) - sum(pengeluaran)
    const kasBalanceRp = financeTransactions.reduce((acc, t) => {
      return t.type === 'pemasukan' ? acc + t.amount : acc - t.amount;
    }, 0);

    return {
      totalTphKg,
      totalFactoryKg,
      totalMedaranDiffKg,
      medaranSurplusPercentage,
      totalMedaranOmsetRp,
      totalGroupFeeRp,
      totalGroupOmsetRp,
      totalFarmerPayoutRp,
      averagePricePerKg,
      totalBunches,
      activeFarmersCount,
      totalLandAreaHa,
      kasBalanceRp,
    };
  }, [harvestBatches, farmers, financeTransactions]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        login,
        logout,
        isLoggedIn,
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        farmers,
        harvestBatches,
        financeTransactions,
        addFarmer,
        updateFarmer,
        deleteFarmer,
        addHarvestBatch,
        updateHarvestBatch,
        deleteHarvestBatch,
        addFinanceTransaction,
        deleteFinanceTransaction,
        resetToDemoData,
        toast,
        showToast,
        globalSearch,
        setGlobalSearch,
        metrics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
