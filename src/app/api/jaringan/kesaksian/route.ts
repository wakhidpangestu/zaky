import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cariAnggota } from '@/infrastructure/jaringan/direktori';
import { verifikasiTandaTanganKesaksian } from '@/infrastructure/jaringan/kesaksian';
import { OfficeHttpError, readOfficeJson } from '@/lib/office/http';
import { RateLimiter, clientIp } from '@/lib/rate-limit';

/**
 * Network Endpoint: POST /api/jaringan/kesaksian
 * Sesuai Bab 8.2, Bab 10.1, Bab 10.3, dan FR-42 s/d FR-45
 * Menerima kesaksian silang dari instance lembaga anggota lain
 */
const MAX_SKEW_MS = 5 * 60_000; // Bab 10.3: ditolak jika > 5 menit
const hex = (bytes: number) => z.string().regex(new RegExp(`^[0-9a-f]{${bytes * 2}}$`, 'i'));

const kesaksianSchema = z
  .object({
    saksi_lembaga_id: z.string().min(1).max(64),
    lembaga_id: z.string().min(1).max(64),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hash_disaksikan: hex(32),
    diamati_pada: z.iso.datetime({ offset: true }),
    tanda_tangan_saksi: hex(64),
  })
  .strict();

// Tanda tangan yang sudah diterima dalam jendela waktu -> tolak replay.
const seen = new Map<string, number>();
function rememberSignature(signature: string, now: number): boolean {
  for (const [sig, at] of seen) if (now - at > 2 * MAX_SKEW_MS) seen.delete(sig);
  if (seen.has(signature)) return false;
  seen.set(signature, now);
  return true;
}

const limiter = new RateLimiter(60, 60_000);
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
  try {
    if (limiter.hit('ip:' + clientIp(request.headers))) return fail('Terlalu banyak permintaan.', 429);

    const parsed = kesaksianSchema.safeParse(await readOfficeJson(request));
    if (!parsed.success) return fail('Parameter kesaksian tidak lengkap atau tidak valid.', 400);
    const body = parsed.data;

    // 1. Perlindungan replay memakai waktu yang IKUT DITANDATANGANI (diamati_pada).
    const now = Date.now();
    if (Math.abs(now - new Date(body.diamati_pada).getTime()) > MAX_SKEW_MS)
      return fail('REPLAY_DETECTED: Waktu kesaksian di luar jendela 5 menit.', 400);

    // 2. Aturan dasar kesaksian silang: tidak boleh bersaksi untuk diri sendiri
    if (body.saksi_lembaga_id === body.lembaga_id)
      return fail('CHECK_VIOLATION: Lembaga tidak dapat menjadi saksi atas dirinya sendiri.', 422);

    // 3. Cari kunci publik saksi di direktori anggota federasi
    const saksiLembaga = cariAnggota(body.saksi_lembaga_id);
    if (!saksiLembaga) return fail('Lembaga saksi tidak dikenal dalam direktori anggota.', 403);

    // 4. Verifikasi tanda tangan kriptografis Ed25519
    if (!verifikasiTandaTanganKesaksian(body, saksiLembaga.kunci_publik_ed25519))
      return fail('INVALID_SIGNATURE: Tanda tangan Ed25519 saksi tidak valid.', 401);

    // 5. Tanda tangan sah hanya boleh dipakai sekali
    if (!rememberSignature(body.tanda_tangan_saksi.toLowerCase(), now))
      return fail('REPLAY_DETECTED: Kesaksian ini sudah pernah diterima.', 409);

    return NextResponse.json(
      {
        success: true,
        pesan: `Kesaksian dari ${saksiLembaga.nama} untuk tanggal ${body.tanggal} berhasil dicatat.`,
        saksi_lembaga_id: body.saksi_lembaga_id,
        lembaga_id: body.lembaga_id,
        tanggal: body.tanggal,
        tercatat_pada: new Date(now).toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OfficeHttpError) return fail(error.message, error.status);
    console.error('Kesaksian gagal diproses', error instanceof Error ? error.name : 'UnknownError');
    return fail('Kesalahan internal server', 500);
  }
}
