import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Cron Endpoint: POST /api/cron/hash-harian
 * Dipanggil otomatis setiap 00:00 WIB (Vercel Cron)
 * Sesuai Bab 8.1, FR-38 s/d FR-41
 *
 * Perbaikan audit T4:
 * - FAIL-CLOSED: tanpa CRON_SECRET yang terkonfigurasi, endpoint MENOLAK
 *   berjalan (sebelumnya terbuka untuk siapa pun). Perbandingan secret
 *   memakai waktu konstan.
 * - Tanggal target dihitung sebagai "kemarin" menurut Asia/Jakarta secara
 *   eksplisit (sebelumnya memakai toISOString UTC sehingga meleset sehari).
 * - Tidak ada lagi penerbitan semu: kunci ephemeral + hash rekaan sudah
 *   dihapus. Selama penerbitan ke tabel hash_harian PostgreSQL belum
 *   terhubung, endpoint menjawab 501 secara jujur.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      {
        error:
          'CRON_SECRET belum dikonfigurasi. Endpoint cron menolak berjalan tanpa secret (fail-closed).',
      },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${cronSecret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'UNAUTHORIZED: Cron secret tidak valid.' }, { status: 401 });
  }

  // Kemarin menurut Asia/Jakarta (WIB), diformat YYYY-MM-DD
  const kemarinWib = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tanggalTarget = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(kemarinWib);

  return NextResponse.json(
    {
      success: false,
      tanggal_target: tanggalTarget,
      error:
        'Penerbitan hash harian ke PostgreSQL belum terhubung pada deployment ini, ' +
        'sehingga tidak ada hash yang diterbitkan. Endpoint ini sengaja tidak lagi ' +
        'menandatangani hash rekaan dengan kunci ephemeral.',
    },
    { status: 501 }
  );
}
