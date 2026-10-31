import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { terimaKesaksian } from '@/lib/jaringan/kesaksian-masuk';
import { OfficeHttpError, readOfficeJson } from '@/lib/office/http';
import { clientIp } from '@/lib/rate-limit';
import { SharedRateLimiter } from '@/lib/rate-limit-db';

/**
 * Network Endpoint: POST /api/jaringan/kesaksian
 * Sesuai Bab 8.2, Bab 10.1, Bab 10.3, dan FR-42 s/d FR-45
 * Menerima kesaksian silang dari instance lembaga anggota lain, memverifikasinya,
 * lalu menyimpannya ke tabel kesaksian (lihat lib/jaringan/kesaksian-masuk.ts).
 */
const hex = (bytes: number) => z.string().regex(new RegExp(`^[0-9a-f]{${bytes * 2}}$`, 'i'));

const kesaksianSchema = z
  .object({
    saksi_lembaga_id: z.guid(),
    lembaga_id: z.guid(),
    tanggal: z.iso.date(),
    hash_disaksikan: hex(32),
    diamati_pada: z.iso.datetime({ offset: true }),
    tanda_tangan_saksi: hex(64),
  })
  .strict();

const limiter = new SharedRateLimiter('kesaksian', 60, 60_000);
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
  try {
    if (await limiter.hit('ip:' + clientIp(request.headers))) return fail('Terlalu banyak permintaan.', 429);

    const parsed = kesaksianSchema.safeParse(await readOfficeJson(request));
    if (!parsed.success) return fail('Parameter kesaksian tidak lengkap atau tidak valid.', 400);

    const hasil = await terimaKesaksian(query, parsed.data);
    return NextResponse.json(hasil.body, { status: hasil.status });
  } catch (error) {
    if (error instanceof OfficeHttpError) return fail(error.message, error.status);
    console.error('Kesaksian gagal diproses', error instanceof Error ? error.name : 'UnknownError');
    return fail('Kesalahan internal server', 500);
  }
}
