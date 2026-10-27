import { NextRequest, NextResponse } from 'next/server';
import { cariAnggota } from '@/infrastructure/jaringan/direktori';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Public Endpoint: GET /api/publik/hash-harian/[lembaga]/[tanggal]
 * Sesuai Bab 8.2 dan FR-38 s/d FR-41
 * Mengembalikan payload kanonikal JCS dan tanda tangan Ed25519
 *
 * Perbaikan audit T3: endpoint ini sebelumnya MENGARANG hash kepala dan tanda
 * tangan dari pola string untuk tanggal berapa pun. Sekarang endpoint hanya
 * menjawab dari sumber penerbitan yang nyata; selama tabel hash_harian belum
 * terhubung di deployment ini, jawabannya adalah 404 "belum diterbitkan" -
 * bukan bukti rekaan.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ lembaga: string; tanggal: string }> }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'tidak-dikenal';
  const rate = checkRateLimit(`publik-hash-harian:${ip}`, 60, 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    );
  }

  const { lembaga, tanggal } = await context.params;

  const infoLembaga = cariAnggota(lembaga);
  if (!infoLembaga) {
    return NextResponse.json(
      { error: `Lembaga dengan ID/kode '${lembaga}' tidak terdaftar di direktori anggota.` },
      { status: 404 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || Number.isNaN(new Date(`${tanggal}T00:00:00Z`).getTime())) {
    return NextResponse.json(
      { error: `Format tanggal '${tanggal}' tidak valid. Gunakan format YYYY-MM-DD.` },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      diterbitkan: false,
      lembaga_id: infoLembaga.id,
      tanggal,
      error:
        'Hash harian untuk lembaga dan tanggal ini belum diterbitkan pada deployment ini. ' +
        'Endpoint tidak menyajikan hash atau tanda tangan rekaan; hubungkan tabel hash_harian PostgreSQL untuk mengaktifkan penerbitan.',
    },
    {
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    }
  );
}
