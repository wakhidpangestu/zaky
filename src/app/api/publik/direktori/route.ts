import { NextResponse } from 'next/server';
import { muatDirektoriAnggota } from '@/infrastructure/jaringan/direktori';
import { kunciLembaga } from '@/lib/jaringan/kunci';

/**
 * Public Endpoint: GET /api/publik/direktori
 * Direktori anggota jaringan saksi beserta kunci publik Ed25519, agar instans lain dapat
 * memverifikasi hash harian dan kesaksian. Isinya sama dengan direktori/anggota.json di repositori.
 */
export async function GET() {
  const dir = muatDirektoriAnggota();
  return NextResponse.json(
    {
      versi: dir.versi,
      terakhir_diperbarui: dir.terakhir_diperbarui,
      kunci_demo: (['A', 'B', 'C'] as const).some((k) => kunciLembaga(k).demo),
      anggota: dir.anggota.map(({ id, kode, nama, kota, provinsi, kunci_publik_ed25519, status }) => ({
        id,
        kode,
        nama,
        kota,
        provinsi,
        kunci_publik_ed25519,
        status,
      })),
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
