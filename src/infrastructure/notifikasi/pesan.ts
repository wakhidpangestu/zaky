/**
 * Infrastructure: Layanan Notifikasi (SMS / WhatsApp / Internal)
 * Sesuai Bab 3, Bab 6.5, dan Bab 10.1 (Tautan Sekali Pakai Mustahik)
 */

export interface PengirimanTautanMustahik {
  teleponMasked: string;
  namaSamaran: string;
  nominal: number;
  tautanKonfirmasi: string;
  kedaluwarsaJam: number;
}

/**
 * Mengirimkan tautan konfirmasi sekali pakai ke penerima manfaat (mustahik)
 */
export async function kirimTautanMustahik(
  data: PengirimanTautanMustahik
): Promise<{ terkirim: boolean; pesanId: string }> {
  // Pada lingkungan produksi memanggil API SMS Gateway / WhatsApp Official
  // Token konfirmasi dikirimkan langsung ke penerima, hash token dicatat di DB
  const pesanId = `msg-${Date.now()}`;

  return {
    terkirim: true,
    pesanId,
  };
}
