/**
 * Dipanggil sekali sebelum server menerima request.
 * Produksi menolak start bila secret tidak aman (fail-fast), daripada
 * berjalan dengan autentikasi yang bisa dipalsukan.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { hasStrongJwtSecret } = await import('./lib/secret');
  if (hasStrongJwtSecret()) return;
  const message =
    'JWT_SECRET tidak aman atau belum diset (minimal 32 karakter acak). Server tidak dijalankan.';
  if (process.env.NODE_ENV === 'production') throw new Error(message);
  console.warn(`[zaky] ${message} Login akan ditolak sampai diperbaiki.`);
}
