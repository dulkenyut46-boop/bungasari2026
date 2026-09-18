import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldCheck, UserCheck, Lock, Mail, Users, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, currentUser, farmers } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser.role);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(
    currentUser.farmerId || farmers[0]?.id || ''
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('••••••••');

  const handleQuickSwitch = (role: UserRole, farmerId?: string) => {
    login(role === 'admin' ? 'admin@bungasari.id' : 'petani@bungasari.id', role, farmerId);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || (selectedRole === 'admin' ? 'admin@bungasari.id' : 'petani@bungasari.id'), selectedRole, selectedFarmerId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ganti Akun & Hak Akses"
      subtitle="Pilih peran atau masuk sebagai Admin Pengurus / Petani Anggota"
      maxWidth="md"
    >
      {/* Quick Switch Preset Cards */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Akses Cepat Demo:
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Admin Option */}
          <button
            type="button"
            onClick={() => handleQuickSwitch('admin')}
            className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
              currentUser.role === 'admin'
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="rounded-lg bg-emerald-600 p-2 text-white shrink-0 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Admin Pengurus</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Kelola semua panen, selisih TPH-PKS, dan kas kelompok
              </div>
            </div>
          </button>

          {/* Petani Option */}
          <button
            type="button"
            onClick={() => handleQuickSwitch('petani', selectedFarmerId || farmers[0]?.id)}
            className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
              currentUser.role === 'petani'
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="rounded-lg bg-sky-600 p-2 text-white shrink-0 shadow-xs">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Petani / Anggota</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Cek hasil panen, timbangan TPH, dan cetak slip panen
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <span className="relative bg-white px-2 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          Atau Masuk Spesifik
        </span>
      </div>

      {/* Detail Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Pilih Peran:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                selectedRole === 'admin'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Pengurus (Admin)
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('petani')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                selectedRole === 'petani'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Petani / Anggota
            </button>
          </div>
        </div>

        {selectedRole === 'petani' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Nama Anggota Petani (20 Anggota Bunga Sari):
            </label>
            <div className="relative">
              <select
                value={selectedFarmerId}
                onChange={e => setSelectedFarmerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {farmers.map(farmer => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmer.code} - {farmer.name} ({farmer.blockLocation})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email Terdaftar
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={selectedRole === 'admin' ? 'admin@bungasari.id' : 'petani@bungasari.id'}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            PIN / Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
        >
          Masuk Sekarang <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </Modal>
  );
};
