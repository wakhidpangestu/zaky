/**
 * Sumber tunggal secret JWT (HS256) untuk lib/auth dan proxy.
 *
 * Aturan (menutup temuan audit K2 - fallback secret hardcoded):
 * - Bila JWT_SECRET diatur: wajib minimal 32 karakter, dipakai apa adanya.
 * - Bila tidak diatur: TIDAK ada secret cadangan yang tertulis di kode.
 *   Sebagai gantinya dibuat secret acak 32 byte per proses (tersimpan di
 *   globalThis agar modul server dan proxy dalam proses yang sama berbagi
 *   nilai yang sama). Secret acak tidak dapat ditebak/dipalsukan; konsekuensi
 *   satu-satunya adalah sesi gugur saat server dimulai ulang. Untuk produksi
 *   dan deployment multi-instans (mis. middleware edge terpisah), JWT_SECRET
 *   WAJIB diatur lewat environment.
 */

const globalStore = globalThis as unknown as {
  __zakyJwtSecretEphemeral?: Uint8Array;
};

export function getJwtSecret(): Uint8Array {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) {
    if (fromEnv.length < 32) {
      throw new Error('JWT_SECRET tidak aman: wajib minimal 32 karakter.');
    }
    return new TextEncoder().encode(fromEnv);
  }

  if (!globalStore.__zakyJwtSecretEphemeral) {
    globalStore.__zakyJwtSecretEphemeral = crypto.getRandomValues(new Uint8Array(32));
    console.warn(
      '[zaky] JWT_SECRET belum diatur: memakai secret ephemeral acak per proses. ' +
        'Sesi akan gugur saat server dimulai ulang. Atur JWT_SECRET (min. 32 karakter) untuk produksi.'
    );
  }
  return globalStore.__zakyJwtSecretEphemeral;
}
