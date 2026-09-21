import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatKg(kg: number): string {
  return `${new Intl.NumberFormat('id-ID').format(kg)} Kg`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row
      .map(val => {
        const text = String(val ?? '').replace(/"/g, '""');
        return `"${text}"`;
      })
      .join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(processRow).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Robust CSV parser supporting quotes, commas, and semicolons (common in Indonesian Excel)
 */
export function parseCSV(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, ''); // Remove BOM if present
  const lines = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result: string[][] = [];

  // Detect delimiter from first non-empty line
  const firstLine = lines.find(l => l.trim().length > 0) || '';
  const delimiter = firstLine.includes(';') && (!firstLine.includes(',') || (firstLine.split(';').length > firstLine.split(',').length)) ? ';' : ',';

  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++; // skip escaped quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === delimiter && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    if (row.some(cell => cell.length > 0)) {
      result.push(row);
    }
  }
  return result;
}

export function downloadFarmerTemplate() {
  const headers = [
    'Kode Anggota',
    'Nama Petani',
    'No Telepon',
    'Luas Lahan (Ha)',
    'Lokasi Blok TPH',
    'Tahun Tanam',
    'Bank',
    'No Rekening',
    'Atas Nama',
  ];
  const sampleRows = [
    ['BS-021', 'H. Mansyur S.', '081288991122', '2.5', 'Blok E - TPH 01', '2018', 'BRI', '542101009822501', 'H. Mansyur S.'],
    ['BS-022', 'Siti Aminah', '081399882233', '1.8', 'Blok E - TPH 02', '2019', 'Mandiri', '1380029384721', 'Siti Aminah'],
    ['BS-023', 'Wayan Sujana', '081277334455', '3.0', 'Blok E - TPH 03', '2017', 'BRI', '329001928374502', 'Wayan Sujana'],
    ['BS-024', 'Ahmad Baihaqi', '085266778899', '2.0', 'Blok F - TPH 01', '2020', 'BNI', '0928374829', 'Ahmad Baihaqi'],
  ];
  downloadCSV('TEMPLATE_IMPORT_PETANI_BUNGA_SARI', [headers, ...sampleRows]);
}

export function downloadTphWeighingTemplate() {
  const headers = ['Nama Petani', 'Lokasi TPH', 'Berat TPH (Kg)'];
  const sampleRows = [
    ['Pak Supriyadi', 'Blok A - TPH 01', '2250'],
    ['H. Samsudin', 'Blok A - TPH 02', '1980'],
    ['Bpk. Joko Susilo', 'Blok A - TPH 03', '2410'],
    ['Pak Sukirno', 'Blok B - TPH 01', '1860'],
    ['Bpk. Bambang P.', 'Blok B - TPH 02', '2150'],
    ['H. Mansyur S.', 'Blok E - TPH 01', '2040'],
    ['Siti Aminah', 'Blok E - TPH 02', '1780'],
  ];
  downloadCSV('TEMPLATE_TIMBANGAN_TPH_PANEN_BARU', [headers, ...sampleRows]);
}

export function downloadHarvestBatchTemplate() {
  const headers = [
    'No SPB',
    'Tiket PKS',
    'Tanggal Panen (YYYY-MM-DD)',
    'PKS Tujuan',
    'No Polisi Truk',
    'Nama Sopir',
    'Harga TBS (Rp/Kg)',
    'Iuran Kas (Rp/Kg)',
    'Bruto Pabrik (Kg)',
    'Tarra Truk Kosong (Kg)',
    'Sortir (%)',
    'Total TPH Kebun (Kg)',
  ];
  const sampleRows = [
    ['SPB-BS-28', 'TK-PKS-98410', '2026-09-20', 'PKS PT Sawit Makmur Perkasa', 'BM 8342 QA', 'Pak Darno', '2950', '25', '21800', '7720', '1.5', '13820'],
    ['SPB-BS-29', 'TK-PKS-98520', '2026-09-21', 'PKS PT Sawit Makmur Perkasa', 'BM 8342 QA', 'Pak Darno', '2980', '25', '22400', '7740', '1.2', '14450'],
  ];
  downloadCSV('TEMPLATE_PANEN_BARU_BUNGA_SARI', [headers, ...sampleRows]);
}
