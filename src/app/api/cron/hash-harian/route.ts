import { NextRequest, NextResponse } from 'next/server';
import { papanSilang, tanggalTertutup, terbitkanDanSaksikan } from '@/lib/jaringan/papan';
import { isStrongSecret, safeEqual } from '@/lib/secret';

/**
 * Cron Endpoint: GET|POST /api/cron/hash-harian
 * Vercel Cron memanggil dengan GET setiap 00.01 WIB (17.01 UTC) membawa
 * `Authorization: Bearer <CRON_SECRET>`. POST tetap diterima untuk pemanggilan manual.
 * Sesuai Bab 8.1, FR-38 s/d FR-41
 */
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const cronSecret = process.env.CRON_SECRET;

    // Fail-closed: tanpa CRON_SECRET yang kuat, endpoint tidak bisa dipanggil sama sekali.
    if (!isStrongSecret(cronSecret)) {
      return NextResponse.json({ error: 'Cron belum dikonfigurasi.' }, { status: 503 });
    }
    if (!safeEqual(authHeader, `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Cron secret tidak valid.' }, { status: 401 });
    }

    // Tutup buku hari kemarin (WIB): Lembaga A menerbitkan hash, B dan C menyaksikan.
    const [tanggalTarget] = tanggalTertutup(1);
    await terbitkanDanSaksikan(tanggalTarget);
    const hasil = await papanSilang(tanggalTarget);

    return NextResponse.json(
      {
        success: true,
        pesan: `Hash harian tanggal ${tanggalTarget} berhasil diterbitkan dan ditandatangani.`,
        data: hasil,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron hash-harian gagal', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'Gagal mengeksekusi penerbitan hash cron.' }, { status: 500 });
  }
}
