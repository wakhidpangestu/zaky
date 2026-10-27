import { NextRequest, NextResponse } from 'next/server';
import { cariAnggota } from '@/infrastructure/jaringan/direktori';
import { verifikasiTandaTanganKesaksian, KesaksianLengkap } from '@/infrastructure/jaringan/kesaksian';
import {
  validasiTimestamp,
  daftarkanNonce,
  verifikasiSignatureJaringan,
} from '@/infrastructure/jaringan/anti-replay';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Network Endpoint: POST /api/jaringan/kesaksian
 * Sesuai Bab 8.2, Bab 10.1, Bab 10.3, dan FR-42 s/d FR-45
 * Menerima kesaksian silang dari instance lembaga anggota lain
 */
export async function POST(request: NextRequest) {
  try {
    // 0. Rate limiting per IP (audit S7)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'tidak-dikenal';
    const rate = checkRateLimit(`kesaksian:${ip}`, 60, 60 * 1000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'RATE_LIMITED: Terlalu banyak permintaan kesaksian.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
      );
    }

    const timestampHeader = request.headers.get('X-Zaky-Timestamp');
    const nonceHeader = request.headers.get('X-Zaky-Nonce');

    // 1. Perlindungan Serangan Replay (Bab 10.3 + audit S2):
    //    timestamp WAJIB dan segar (<= 5 menit), nonce WAJIB dan sekali pakai
    const cekWaktu = validasiTimestamp(timestampHeader);
    if (!cekWaktu.ok) {
      return NextResponse.json({ error: cekWaktu.error }, { status: 400 });
    }
    const cekNonce = daftarkanNonce(nonceHeader);
    if (!cekNonce.ok) {
      return NextResponse.json({ error: cekNonce.error }, { status: 400 });
    }

    // Baca body mentah dulu agar tanda tangan jaringan (HMAC) dapat diverifikasi
    const rawBody = await request.text();

    // 1b. Tanda tangan jaringan HMAC (wajib bila JARINGAN_SECRET dikonfigurasi)
    const cekSig = verifikasiSignatureJaringan(
      request.headers.get('X-Zaky-Signature'),
      timestampHeader!,
      nonceHeader!,
      rawBody
    );
    if (!cekSig.ok) {
      return NextResponse.json({ error: cekSig.error }, { status: 401 });
    }

    const body: KesaksianLengkap = JSON.parse(rawBody);

    // 2. Validasi kelengkapan parameter
    if (
      !body.saksi_lembaga_id ||
      !body.lembaga_id ||
      !body.tanggal ||
      !body.hash_disaksikan ||
      !body.tanda_tangan_saksi
    ) {
      return NextResponse.json(
        { error: 'Parameter kesaksian tidak lengkap.' },
        { status: 400 }
      );
    }

    // 3. Validasi aturan dasar kesaksian silang: tidak boleh bersaksi untuk diri sendiri
    if (body.saksi_lembaga_id === body.lembaga_id) {
      return NextResponse.json(
        { error: 'CHECK_VIOLATION: Lembaga tidak dapat menjadi saksi atas dirinya sendiri.' },
        { status: 422 }
      );
    }

    // 4. Cari kunci publik saksi di direktori anggota federasi
    const saksiLembaga = cariAnggota(body.saksi_lembaga_id);
    if (!saksiLembaga) {
      return NextResponse.json(
        { error: `Lembaga saksi '${body.saksi_lembaga_id}' tidak dikenal dalam direktori anggota.` },
        { status: 403 }
      );
    }

    // 5. Verifikasi tanda tangan kriptografis Ed25519
    const isValidSignature = verifikasiTandaTanganKesaksian(
      body,
      saksiLembaga.kunci_publik_ed25519
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'INVALID_SIGNATURE: Tanda tangan Ed25519 saksi tidak valid.' },
        { status: 401 }
      );
    }

    // Kesaksian sah dicatat
    return NextResponse.json(
      {
        success: true,
        pesan: `Kesaksian dari ${saksiLembaga.nama} untuk tanggal ${body.tanggal} berhasil dicatat.`,
        saksi_lembaga_id: body.saksi_lembaga_id,
        lembaga_id: body.lembaga_id,
        tanggal: body.tanggal,
        tercatat_pada: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Kesalahan internal server',
      },
      { status: 500 }
    );
  }
}
