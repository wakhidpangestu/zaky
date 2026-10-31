import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { kunciLembaga } from '@/lib/jaringan/kunci';

/**
 * Health Check API Endpoint
 * Sesuai Bab 11 (Ketersediaan). Setiap metrik diukur saat dipanggil, bukan ditulis tetap:
 * basis data diuji dengan SELECT 1 berbatas waktu, jaringan dilaporkan apa adanya.
 */
const DB_TIMEOUT_MS = 3000;

async function cekBasisData(): Promise<{ status: 'siap' | 'gagal'; latensi_ms: number }> {
  const mulai = Date.now();
  try {
    await Promise.race([
      query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), DB_TIMEOUT_MS)),
    ]);
    return { status: 'siap', latensi_ms: Date.now() - mulai };
  } catch {
    return { status: 'gagal', latensi_ms: Date.now() - mulai };
  }
}

export async function GET() {
  const db = await cekBasisData();
  const kunciDemo = (['A', 'B', 'C'] as const).some((k) => kunciLembaga(k).demo);

  return NextResponse.json(
    {
      status: db.status === 'siap' ? 'ok' : 'terganggu',
      layanan: 'Zaky Multi-Institution Verification Node',
      versi: '5.0',
      waktu_utc: new Date().toISOString(),
      metrik: {
        basis_data: db.status,
        latensi_basis_data_ms: db.latensi_ms,
        // Tiga lembaga berjalan dalam satu deployment; protokol kesaksian siap dipisah per server.
        jaringan_saksi: 'simulasi_satu_deployment',
        kunci_penandatangan: kunciDemo ? 'demo' : 'rahasia_terkonfigurasi',
      },
    },
    { status: db.status === 'siap' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
