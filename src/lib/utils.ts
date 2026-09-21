import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

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

/**
 * Downloads a styled, professional Excel (.xlsx) file with specified sheets, headers, column widths, and sample data.
 */
export function downloadExcel(
  filename: string,
  sheetName: string,
  data: (string | number)[][],
  columnWidths?: number[]
) {
  const ws = XLSX.utils.aoa_to_sheet(data);

  if (columnWidths && columnWidths.length > 0) {
    ws['!cols'] = columnWidths.map(wch => ({ wch }));
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
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
 * Parses either Excel (.xlsx, .xls) or CSV files into 2D string array.
 */
export async function parseSpreadsheetFile(file: File): Promise<string[][]> {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  if (isExcel) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const worksheet = workbook.Sheets[firstSheetName];
    // header: 1 returns array of arrays
    const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    });
    return rawData.map(row => (Array.isArray(row) ? row.map(c => String(c ?? '').trim()) : []));
  } else {
    // CSV fallback
    const text = await file.text();
    return parseCSV(text);
  }
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

/**
 * Rapi & Resmi: Template Excel (.xlsx) Data Petani
 */
export function downloadFarmerTemplate() {
  const headers = [
    'Kode Anggota',
    'Nama Petani',
    'No Telepon/WA',
    'Luas Lahan (Ha)',
    'Lokasi Blok TPH',
    'Tahun Tanam',
    'Bank',
    'No Rekening',
    'Nama Pemilik Rekening',
  ];
  const sampleRows = [
    ['BS-021', 'H. Mansyur S.', '081288991122', 2.5, 'Blok E - TPH 01', 2018, 'BRI', '542101009822501', 'H. Mansyur S.'],
    ['BS-022', 'Siti Aminah', '081399882233', 1.8, 'Blok E - TPH 02', 2019, 'Mandiri', '1380029384721', 'Siti Aminah'],
    ['BS-023', 'Wayan Sujana', '081277334455', 3.0, 'Blok E - TPH 03', 2017, 'BRI', '329001928374502', 'Wayan Sujana'],
    ['BS-024', 'Ahmad Baihaqi', '085266778899', 2.0, 'Blok F - TPH 01', 2020, 'BNI', '0928374829', 'Ahmad Baihaqi'],
    ['BS-025', 'Pak Rusli Effendi', '081377889900', 2.2, 'Blok F - TPH 02', 2019, 'BSI', '7123984712', 'Rusli Effendi'],
  ];

  // Lebar kolom rapi
  const columnWidths = [16, 26, 18, 16, 20, 14, 12, 22, 26];

  downloadExcel('Template_Petani_Bunga_Sari', 'Data Petani', [headers, ...sampleRows], columnWidths);
}

/**
 * Rapi & Resmi: Template Excel (.xlsx) Timbangan TPH per Petani
 */
export function downloadTphWeighingTemplate() {
  const headers = ['Nama Petani', 'Lokasi TPH', 'Berat TPH (Kg)'];
  const sampleRows = [
    ['Pak Supriyadi', 'Blok A - TPH 01', 2250],
    ['H. Samsudin', 'Blok A - TPH 02', 1980],
    ['Bpk. Joko Susilo', 'Blok A - TPH 03', 2410],
    ['Pak Sukirno', 'Blok B - TPH 01', 1860],
    ['Bpk. Bambang P.', 'Blok B - TPH 02', 2150],
    ['H. Mansyur S.', 'Blok E - TPH 01', 2040],
    ['Siti Aminah', 'Blok E - TPH 02', 1780],
    ['Wayan Sujana', 'Blok E - TPH 03', 2120],
  ];

  const columnWidths = [26, 20, 18];

  downloadExcel('Template_Timbangan_TPH_Kebun', 'Timbangan TPH', [headers, ...sampleRows], columnWidths);
}

/**
 * Rapi & Resmi: Template Excel (.xlsx) Rekapan Panen Baru (TPH & Pabrik PKS)
 */
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
    'Tarra Truk (Kg)',
    'Sortir (%)',
    'Total TPH Kebun (Kg)',
  ];
  const sampleRows = [
    ['SPB-BS-28', 'TK-PKS-98410', '2026-09-20', 'PKS PT Sawit Makmur Perkasa', 'BM 8342 QA', 'Pak Darno', 2950, 25, 21800, 7720, 1.5, 13820],
    ['SPB-BS-29', 'TK-PKS-98520', '2026-09-21', 'PKS PT Sawit Makmur Perkasa', 'BM 8342 QA', 'Pak Darno', 2980, 25, 22400, 7740, 1.2, 14450],
  ];

  const columnWidths = [16, 16, 24, 30, 18, 18, 18, 18, 18, 16, 14, 22];

  downloadExcel('Template_Panen_Baru_Bunga_Sari', 'Catatan Panen', [headers, ...sampleRows], columnWidths);
}
