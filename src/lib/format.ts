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
