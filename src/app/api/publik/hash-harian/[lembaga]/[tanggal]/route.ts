import { NextRequest, NextResponse } from 'next/server';
import { cariAnggota } from '@/infrastructure/jaringan/direktori';
import { sha256Hex } from '@/infrastructure/kripto/sha256';

/**
 * Public Endpoint: GET /api/publik/hash-harian/[lembaga]/[tanggal]
 * Sesuai Bab 8.2 dan FR-38 s/d FR-41
 * Mengembalikan payload kanonikal JCS dan tanda tangan Ed25519
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ lembaga: string; tanggal: string }> }
) {
  const { lembaga, tanggal } = await context.params;

  const infoLembaga = cariAnggota(lembaga);
  if (!infoLembaga) {
    return NextResponse.json(
      { error: `Lembaga dengan ID/kode '${lembaga}' tidak terdaftar di direktori anggota.` },
      { status: 404 }
    );
  }

  // Sample seed / hash harian data untuk tanggal yang diminta
  // Di lingkungan produksi membaca dari tabel hash_harian
  const mockHashKepala = sha256Hex(`${infoLembaga.id}:${tanggal}:zaky-daily-chain-proof`);

  const payloadKanonikal = {
    versi: 1,
    lembaga_id: infoLembaga.id,
    tanggal,
    hash_kepala: mockHashKepala,
    jumlah_entri: 14,
    diterbitkan_pada: `${tanggal}T00:00:00.000Z`,
    kunci_id: 'ed25519-v1',
    // Tanda tangan mock yang valid sesuai format hex
    tanda_tangan:
      '7a2b9f3c1d4e5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
  };

  return NextResponse.json(payloadKanonikal, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
