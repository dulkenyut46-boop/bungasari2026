import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { HarvestBatchView } from './components/harvest/HarvestBatchView';
import { HarvestBatchDetailModal } from './components/harvest/HarvestBatchDetailModal';
import { HarvestBatchFormModal } from './components/harvest/HarvestBatchFormModal';
import { FarmersView } from './components/farmers/FarmersView';
import { FarmerFormModal } from './components/farmers/FarmerFormModal';
import { FarmerSlipModal } from './components/farmers/FarmerSlipModal';
import { HarvestCalculator } from './components/calculator/HarvestCalculator';
import { FinanceView } from './components/finance/FinanceView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { AuthModal } from './components/common/AuthModal';
import { ToastContainer } from './components/common/Toast';
import { HarvestBatch, Farmer } from './types';

const MainAppContent: React.FC = () => {
  const { activeTab, harvestBatches } = useApp();

  // Navigation & Drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedBatchForDetail, setSelectedBatchForDetail] = useState<HarvestBatch | null>(null);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<HarvestBatch | null>(null);

  const [isFarmerModalOpen, setIsFarmerModalOpen] = useState(false);
  const [farmerToEdit, setFarmerToEdit] = useState<Farmer | null>(null);
  const [farmerForSlip, setFarmerForSlip] = useState<Farmer | null>(null);

  // Handlers
  const handleSelectBatch = (batch: HarvestBatch) => {
    setSelectedBatchForDetail(batch);
  };

  const handleEditBatch = (batch: HarvestBatch) => {
    setBatchToEdit(batch);
    setIsNewBatchModalOpen(true);
  };

  const handleOpenNewBatch = () => {
    setBatchToEdit(null);
    setIsNewBatchModalOpen(true);
  };

  const handleOpenNewFarmer = () => {
    setFarmerToEdit(null);
    setIsFarmerModalOpen(true);
  };

  const handleEditFarmer = (farmer: Farmer) => {
    setFarmerToEdit(farmer);
    setIsFarmerModalOpen(true);
  };

  const handleViewSlip = (farmer: Farmer) => {
    setFarmerForSlip(farmer);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenNewBatchModal={handleOpenNewBatch}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1550px]">
            {activeTab === 'dashboard' && (
              <DashboardView
                onSelectBatch={handleSelectBatch}
                onOpenNewBatchModal={handleOpenNewBatch}
                onViewSlip={handleViewSlip}
                onOpenNewFarmer={handleOpenNewFarmer}
              />
            )}

            {activeTab === 'panen' && (
              <HarvestBatchView
                onSelectBatch={handleSelectBatch}
                onEditBatch={handleEditBatch}
                onOpenNewBatchModal={handleOpenNewBatch}
              />
            )}

            {activeTab === 'petani' && (
              <FarmersView
                onOpenNewFarmerModal={handleOpenNewFarmer}
                onEditFarmer={handleEditFarmer}
                onViewSlip={handleViewSlip}
              />
            )}

            {activeTab === 'kalkulator' && <HarvestCalculator />}

            {activeTab === 'kas_kelompok' && <FinanceView />}

            {activeTab === 'laporan' && <ReportsView />}

            {activeTab === 'pengaturan' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <HarvestBatchDetailModal
        batch={selectedBatchForDetail}
        isOpen={!!selectedBatchForDetail}
        onClose={() => setSelectedBatchForDetail(null)}
        onEdit={handleEditBatch}
      />

      <HarvestBatchFormModal
        isOpen={isNewBatchModalOpen}
        onClose={() => {
          setIsNewBatchModalOpen(false);
          setBatchToEdit(null);
        }}
        batchToEdit={batchToEdit}
      />

      <FarmerFormModal
        isOpen={isFarmerModalOpen}
        onClose={() => {
          setIsFarmerModalOpen(false);
          setFarmerToEdit(null);
        }}
        farmerToEdit={farmerToEdit}
      />

      <FarmerSlipModal
        farmer={farmerForSlip}
        batches={harvestBatches}
        isOpen={!!farmerForSlip}
        onClose={() => setFarmerForSlip(null)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
