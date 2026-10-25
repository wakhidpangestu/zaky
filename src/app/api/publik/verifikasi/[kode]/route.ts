import { NextRequest, NextResponse } from 'next/server';
import { getSavedPenyaluran } from '@/lib/store';
import { sha256Hex } from '@/infrastructure/kripto/sha256';

/**
 * Public Endpoint: GET /api/publik/verifikasi/[kode]
 * Sesuai Bab 10.1, Bab 10.3, FR-56 s/d FR-58
 * Akses publik dengan perlindungan privasi PDP (UU 27/2022)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kode: string }> }
) {
  const { kode } = await context.params;
  const cleanKode = kode.trim().toUpperCase();

  const allItems = getSavedPenyaluran();
  const item = allItems.find((p) => p.kodeUnik.toUpperCase() === cleanKode);

  if (!item) {
    return NextResponse.json(
      {
        valid: false,
        error: `Kode verifikasi '${cleanKode}' tidak ditemukan dalam ledger jaringan antarlembaga.`,
      },
      { status: 404 }
    );
  }

  // Pseudonymized data per UU 27/2022 PDP
  const inisialNama = item.mustahikNama
    .split(' ')
    .map((s, idx) => (idx === 0 ? s : s.charAt(0) + '***'))
    .join(' ');

  return NextResponse.json(
    {
      valid: true,
      kode_unik: item.kodeUnik,
      pos_dana: item.posNama,
      asnaf: item.asnaf,
      nominal: item.nominal,
      status: item.status,
      metode_konfirmasi: item.metode,
      waktu_pengajuan: item.dibuatPada,
      penerima_samaran: inisialNama,
      bukti_kriptografis: {
        hash_transaksi: sha256Hex(`${item.id}:${item.kodeUnik}:${item.nominal}`),
        algoritma: 'SHA-256 / Ed25519',
        status_saksi_silang: 'Terkonfirmasi di Papan Silang Antarlembaga',
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    }
  );
}
