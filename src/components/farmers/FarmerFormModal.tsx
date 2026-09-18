import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Farmer } from '../../types';
import { useApp } from '../../context/AppContext';

interface FarmerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerToEdit?: Farmer | null;
}

export const FarmerFormModal: React.FC<FarmerFormModalProps> = ({
  isOpen,
  onClose,
  farmerToEdit,
}) => {
  const { addFarmer, updateFarmer, farmers } = useApp();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [landAreaHa, setLandAreaHa] = useState<number>(2.0);
  const [blockLocation, setBlockLocation] = useState('Blok A - TPH 01-03');
  const [plantYear, setPlantYear] = useState<number>(2014);
  const [bankName, setBankName] = useState('BRI');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [status, setStatus] = useState<'aktif' | 'non-aktif'>('aktif');

  useEffect(() => {
    if (farmerToEdit) {
      setCode(farmerToEdit.code);
      setName(farmerToEdit.name);
      setPhone(farmerToEdit.phone);
      setLandAreaHa(farmerToEdit.landAreaHa);
      setBlockLocation(farmerToEdit.blockLocation);
      setPlantYear(farmerToEdit.plantYear);
      setBankName(farmerToEdit.bankAccount?.bankName || 'BRI');
      setAccountNumber(farmerToEdit.bankAccount?.accountNumber || '');
      setAccountHolder(farmerToEdit.bankAccount?.accountHolder || farmerToEdit.name);
      setStatus(farmerToEdit.status);
    } else {
      const nextNum = farmers.length + 1;
      setCode(`BS-${String(nextNum).padStart(3, '0')}`);
      setName('');
      setPhone('0812-');
      setLandAreaHa(2.5);
      setBlockLocation('Blok K - TPH 61-63');
      setPlantYear(2015);
      setBankName('BRI');
      setAccountNumber('');
      setAccountHolder('');
      setStatus('aktif');
    }
  }, [farmerToEdit, isOpen, farmers.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      code,
      name,
      phone,
      landAreaHa,
      blockLocation,
      plantYear,
      bankAccount: {
        bankName,
        accountNumber,
        accountHolder: accountHolder || name,
      },
      joinedDate: farmerToEdit?.joinedDate || new Date().toISOString().split('T')[0],
      status,
    };

    if (farmerToEdit) {
      updateFarmer(farmerToEdit.id, data);
    } else {
      addFarmer(data);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={farmerToEdit ? `Edit Data Petani: ${farmerToEdit.name}` : 'Tambah Anggota Petani Baru'}
      subtitle="Data anggota Kelompok Tani Bunga Sari dan lokasi kebun / TPH"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
          >
            {farmerToEdit ? 'Simpan Perubahan' : 'Tambah Petani'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor Anggota *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Keanggotaan
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="aktif">Aktif</option>
              <option value="non-aktif">Non-Aktif</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nama Lengkap Petani *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Contoh: Pak Suparman"
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No. HP / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Luas Lahan Kebun (Ha)
            </label>
            <input
              type="number"
              step="0.1"
              value={landAreaHa}
              onChange={e => setLandAreaHa(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lokasi Blok & TPH
            </label>
            <input
              type="text"
              value={blockLocation}
              onChange={e => setBlockLocation(e.target.value)}
              placeholder="Blok A - TPH 01-03"
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tahun Tanam Sawit
            </label>
            <input
              type="number"
              value={plantYear}
              onChange={e => setPlantYear(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Bank Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
            Rekening Pembayaran Hasil Panen
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              placeholder="Bank (BRI / Mandiri)"
              className="rounded-lg border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
            <input
              type="text"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="Nomor Rekening"
              className="rounded-lg border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
            <input
              type="text"
              value={accountHolder}
              onChange={e => setAccountHolder(e.target.value)}
              placeholder="Atas Nama Rekening"
              className="rounded-lg border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
