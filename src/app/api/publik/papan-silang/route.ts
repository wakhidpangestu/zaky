import { NextRequest, NextResponse } from 'next/server';
import { papanSilang, tanggalTertutup } from '@/lib/jaringan/papan';
import { clientIp } from '@/lib/rate-limit';
import { SharedRateLimiter } from '@/lib/rate-limit-db';

/**
 * Public Endpoint: GET /api/publik/papan-silang?tanggal=YYYY-MM-DD[&simulasi=1]
 * Hash harian Lembaga A, kesaksian Lembaga B dan C, dan hasil hitung ulang rantai saat ini.
 * `simulasi=1` mengubah satu baris log di memori saja untuk menunjukkan deteksi manipulasi.
 */
const limiter = new SharedRateLimiter('papan-silang', 60, 60_000);

export async function GET(request: NextRequest) {
  if (await limiter.hit('ip:' + clientIp(request.headers)))
    return NextResponse.json({ error: 'Terlalu banyak permintaan.' }, { status: 429 });
  const params = request.nextUrl.searchParams;
  const pilihan = tanggalTertutup(30);
  const tanggal = params.get('tanggal') ?? pilihan[0];
  if (!pilihan.includes(tanggal))
    return NextResponse.json({ error: 'Tanggal harus salah satu dari 30 hari terakhir yang sudah tutup buku.' }, { status: 400 });
  try {
    const papan = await papanSilang(tanggal, params.get('simulasi') === '1');
    return NextResponse.json({ ...papan, pilihanTanggal: pilihan.slice(0, 7) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Papan silang gagal', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Papan silang belum bisa dimuat. Periksa koneksi basis data.' }, { status: 503 });
  }
}
