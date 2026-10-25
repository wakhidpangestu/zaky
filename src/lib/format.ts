/**
 * Memformat angka menjadi format Rupiah Indonesia.
 * Contoh: formatRupiah(5000000) → "Rp 5.000.000"
 */
export function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `Rp ${formatted}`;
}

/**
 * Memformat tanggal ke format Indonesia.
 * Contoh: formatTanggal(date) → "27 Okt 2026"
 */
export function formatTanggal(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Memformat waktu ke format Indonesia.
 * Contoh: formatWaktu(date) → "27 Okt 09.10"
 */
export function formatWaktuSingkat(date: Date): string {
  const tgl = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(date);
  const jam = date.getHours().toString().padStart(2, '0');
  const menit = date.getMinutes().toString().padStart(2, '0');
  return `${tgl} ${jam}.${menit}`;
}

/**
 * Konversi angka ke kata terbilang dalam Bahasa Indonesia.
 * Contoh: terbilang(2500000) → "Dua Juta Lima Ratus Ribu"
 */
export function terbilang(nominal: number): string {
  if (nominal === 0) return 'Nol';
  if (nominal < 0) return `Minus ${terbilang(Math.abs(nominal))}`;

  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  const n = Math.floor(nominal);

  if (n < 12) return satuan[n];
  if (n < 20) return `${terbilang(n - 10)} Belas`;
  if (n < 100) return `${terbilang(Math.floor(n / 10))} Puluh ${terbilang(n % 10)}`.trim();
  if (n < 200) return `Seratus ${terbilang(n - 100)}`.trim();
  if (n < 1000) return `${terbilang(Math.floor(n / 100))} Ratus ${terbilang(n % 100)}`.trim();
  if (n < 2000) return `Seribu ${terbilang(n - 1000)}`.trim();
  if (n < 1000000) return `${terbilang(Math.floor(n / 1000))} Ribu ${terbilang(n % 1000)}`.trim();
  if (n < 1000000000) return `${terbilang(Math.floor(n / 1000000))} Juta ${terbilang(n % 1000000)}`.trim();
  if (n < 1000000000000) return `${terbilang(Math.floor(n / 1000000000))} Miliar ${terbilang(n % 1000000000)}`.trim();
  return `${terbilang(Math.floor(n / 1000000000000))} Triliun ${terbilang(n % 1000000000000)}`.trim();
}

/**
 * Konversi angka ke terbilang rupiah resmi.
 * Contoh: formatTerbilangRupiah(2500000) → "Dua Juta Lima Ratus Ribu Rupiah"
 */
export function formatTerbilangRupiah(nominal: number): string {
  return `${terbilang(nominal)} Rupiah`;
}
