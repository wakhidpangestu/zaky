import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { BuktiError, susunBukti } from '@/lib/jaringan/bukti';
import { terbitkanDanSaksikan } from '@/lib/jaringan/papan';
import { clientIp } from '@/lib/rate-limit';
import { SharedRateLimiter } from '@/lib/rate-limit-db';

/**
 * Public Endpoint: GET /api/publik/bukti/{kode}
 * Paket bukti yang dapat diverifikasi mandiri: teks payload setiap entri audit dari catatan
 * sampai kepala rantai, hash harian bertanda tangan Ed25519, dan kesaksian lembaga lain.
 * Verifikator acuan: src/lib/jaringan/verifikasi-bukti.ts (dipakai juga oleh /verifikasi).
 */
const limiter = new SharedRateLimiter('bukti', 30, 60_000);

export async function GET(request: NextRequest, { params }: { params: Promise<{ kode: string }> }) {
  if (await limiter.hit('ip:' + clientIp(request.headers)))
    return NextResponse.json({ error: 'Terlalu banyak permintaan.' }, { status: 429 });
  const kode = (await params).kode.trim().toUpperCase();
  if (!/^(ZK|RC)[A-Z0-9]{10}$/.test(kode))
    return NextResponse.json({ error: 'Kode harus 12 karakter dan berasal dari catatan Zaky.' }, { status: 400 });
  try {
    const bukti = await susunBukti(query, kode, Date.now(), (tanggal) => terbitkanDanSaksikan(tanggal));
    return NextResponse.json(bukti, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof BuktiError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Bukti publik gagal', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Bukti belum bisa disusun. Periksa koneksi basis data.' }, { status: 503 });
  }
}
