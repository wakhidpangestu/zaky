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
 *
 * Perbaikan audit R5: layanan ini masih STUB - belum ada gateway SMS/WhatsApp
 * yang terhubung, jadi fungsi ini TIDAK lagi berpura-pura berhasil. Ia
 * menjawab terkirim: false dengan alasan yang jelas sampai gateway nyata
 * dikonfigurasi, agar pemanggil tidak mencatat pengiriman fiktif sebagai
 * bukti penyampaian.
 */
export async function kirimTautanMustahik(
  data: PengirimanTautanMustahik
): Promise<{ terkirim: boolean; pesanId: string; alasan?: string }> {
  void data;
  return {
    terkirim: false,
    pesanId: '',
    alasan:
      'Gateway notifikasi (SMS/WhatsApp) belum terhubung pada deployment ini; tautan konfirmasi tidak dikirim.',
  };
}
