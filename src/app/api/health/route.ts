import { NextResponse } from 'next/server';

/**
 * Health Check API Endpoint
 * Sesuai Bab 11 (Ketersediaan) dan Standar Operasional AV-01 s/d AV-04
 *
 * Perbaikan audit S5: endpoint ini sebelumnya selalu mengklaim basis data
 * "siap", P2P "online", dan kepatuhan AV-01..04 tanpa pemeriksaan apa pun.
 * Sekarang:
 * - Basis data diperiksa sungguhan bila DATABASE_URL diatur (SELECT 1 dengan
 *   batas waktu 1,5 detik); bila tidak diatur, dilaporkan apa adanya sebagai
 *   "tidak_dikonfigurasi" (mode demo store lokal).
 * - Jaringan P2P dilaporkan "tidak_dikonfigurasi" selama belum ada transport
 *   antar-instans yang berjalan di deployment ini.
 * - Klaim AV-01..04 diberi label eksplisit sebagai target desain yang tidak
 *   diverifikasi oleh endpoint ini.
 * Status HTTP 503 hanya bila dependensi yang DIKONFIGURASI gagal diperiksa.
 */
export async function GET() {
  const mulai = Date.now();

  let basisData: 'terhubung' | 'gagal' | 'tidak_dikonfigurasi' = 'tidak_dikonfigurasi';
  let basisDataSehat = true;

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (databaseUrl) {
    try {
      const { Client } = await import('pg');
      const client = new Client({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 1500,
      });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      basisData = 'terhubung';
    } catch {
      basisData = 'gagal';
      basisDataSehat = false;
    }
  }

  const sehat = basisDataSehat;

  return NextResponse.json(
    {
      status: sehat ? 'ok' : 'terganggu',
      layanan: 'Zaky Multi-Institution Verification Node',
      versi: '4.0',
      waktu_utc: new Date().toISOString(),
      metrik: {
        latensi_pemeriksaan_ms: Date.now() - mulai,
        basis_data: basisData,
        jaringan_p2p: 'tidak_dikonfigurasi',
        mode_data: databaseUrl ? 'postgresql' : 'demo_store_lokal',
      },
      kepatuhan_arsitektur: {
        catatan: 'AV-01 s/d AV-04 adalah target desain arsitektur, TIDAK diverifikasi oleh endpoint ini.',
        AV_01: 'target desain',
        AV_02: 'target desain',
        AV_03: 'target desain',
        AV_04: 'target desain',
      },
    },
    { status: sehat ? 200 : 503 }
  );
}
