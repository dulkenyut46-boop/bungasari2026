import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Farmer } from '../../types';
import { useApp } from '../../context/AppContext';
import { parseCSV, downloadFarmerTemplate } from '../../lib/utils';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface FarmerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmerImportModal: React.FC<FarmerImportModalProps> = ({ isOpen, onClose }) => {
  const { bulkAddFarmers, showToast, farmers } = useApp();
  const [parsedData, setParsedData] = useState<Omit<Farmer, 'id'>[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setParsedData([]);
    setFileName('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Format file harus berakhiran .csv');
      return;
    }

    setErrorMsg('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);

        if (rows.length < 2) {
          setErrorMsg('File CSV tidak memiliki data atau baris kosong.');
          return;
        }

        const headers = rows[0].map(h => h.toLowerCase().trim());
        const nameIdx = headers.findIndex(h => h.includes('nama'));
        const codeIdx = headers.findIndex(h => h.includes('kode'));
        const phoneIdx = headers.findIndex(h => h.includes('telepon') || h.includes('phone') || h.includes('hp') || h.includes('wa'));
        const areaIdx = headers.findIndex(h => h.includes('luas') || h.includes('lahan') || h.includes('ha'));
        const blockIdx = headers.findIndex(h => h.includes('blok') || h.includes('lokasi') || h.includes('tph'));
        const yearIdx = headers.findIndex(h => h.includes('tahun') || h.includes('tanam'));
        const bankIdx = headers.findIndex(h => h.includes('bank'));
        const accNoIdx = headers.findIndex(h => h.includes('rekening') || h.includes('norek'));
        const accHolderIdx = headers.findIndex(h => h.includes('atas') || h.includes('pemilik'));

        if (nameIdx === -1) {
          setErrorMsg('Kolom "Nama Petani" tidak ditemukan pada baris header CSV.');
          return;
        }

        const currentCodes = new Set(farmers.map(f => f.code.toUpperCase()));
        let autoCodeNum = farmers.length + 1;

        const importedFarmers: Omit<Farmer, 'id'>[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          const name = row[nameIdx]?.trim();
          if (!name) continue;

          let code = codeIdx !== -1 ? row[codeIdx]?.trim() : '';
          if (!code) {
            let candidate = `BS-${String(autoCodeNum).padStart(3, '0')}`;
            while (currentCodes.has(candidate)) {
              autoCodeNum++;
              candidate = `BS-${String(autoCodeNum).padStart(3, '0')}`;
            }
            code = candidate;
            currentCodes.add(candidate);
            autoCodeNum++;
          }

          const phone = phoneIdx !== -1 ? row[phoneIdx]?.trim() || '-' : '-';
          const landAreaHa = areaIdx !== -1 ? parseFloat(row[areaIdx]?.replace(',', '.') || '2.0') || 2.0 : 2.0;
          const blockLocation = blockIdx !== -1 ? row[blockIdx]?.trim() || 'Blok Kebun - TPH 01' : 'Blok Kebun - TPH 01';
          const plantYear = yearIdx !== -1 ? parseInt(row[yearIdx] || '2018', 10) || 2018 : 2018;
          const bankName = bankIdx !== -1 ? row[bankIdx]?.trim() : 'BRI';
          const accountNumber = accNoIdx !== -1 ? row[accNoIdx]?.trim() : '-';
          const accountHolder = accHolderIdx !== -1 ? row[accHolderIdx]?.trim() : name;

          importedFarmers.push({
            code,
            name,
            phone,
            landAreaHa,
            blockLocation,
            plantYear,
            bankAccount: {
              bankName: bankName || 'BRI',
              accountNumber: accountNumber || '-',
              accountHolder: accountHolder || name,
            },
            joinedDate: new Date().toISOString().split('T')[0],
            status: 'aktif',
          });
        }

        if (importedFarmers.length === 0) {
          setErrorMsg('Tidak ada baris data petani yang dapat diproses dari CSV ini.');
        } else {
          setParsedData(importedFarmers);
        }
      } catch {
        setErrorMsg('Gagal membaca isi file CSV.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    bulkAddFarmers(parsedData);
    handleClose();
  };

  const handleRemoveRow = (idx: number) => {
    setParsedData(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Data Nama Petani (CSV)"
      subtitle="Unggah file CSV daftar anggota kelompok tani untuk penambahan data secara massal"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedData.length > 0 ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {parsedData.length} data petani siap diimpor
              </span>
            ) : (
              'Format CSV: Nama Petani, No Telepon, Luas Lahan, Blok TPH, Rekening'
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={parsedData.length === 0}
              onClick={handleConfirmImport}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              Simpan & Impor {parsedData.length > 0 ? `(${parsedData.length})` : ''}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Template download notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Gunakan Template CSV Resmi Bunga Sari
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                Unduh file contoh yang sudah disesuaikan dengan kolom-kolom data petani
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadFarmerTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300 cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" /> Unduh Template CSV
          </button>
        </div>

        {/* Upload drop zone */}
        {parsedData.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/60 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Klik untuk memilih file CSV atau seret file ke sini
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              File harus berupa .CSV dengan pemisah koma (,) atau titik koma (;)
            </p>
            {fileName && (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> {fileName}
              </span>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pratinjau Data ({parsedData.length} Petani Terbaca)
                </span>
                <span className="text-[11px] text-slate-500">dari file: {fileName}</span>
              </div>
              <button
                type="button"
                onClick={resetState}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Ganti File
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2">Kode</th>
                    <th className="p-2">Nama Petani</th>
                    <th className="p-2">No Telp/WA</th>
                    <th className="p-2">Luas (Ha)</th>
                    <th className="p-2">Blok TPH</th>
                    <th className="p-2">Bank & Rekening</th>
                    <th className="p-2 text-center w-8">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedData.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {f.code}
                      </td>
                      <td className="p-2 font-semibold text-slate-900 dark:text-white">
                        {f.name}
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{f.phone}</td>
                      <td className="p-2">{f.landAreaHa} Ha</td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{f.blockLocation}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">
                        {f.bankAccount?.bankName} - {f.bankAccount?.accountNumber}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
