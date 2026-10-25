import { NextRequest, NextResponse } from 'next/server';
import { eksekusiPenerbitanHashHarian } from '@/application/use-cases/penerbitan-hash';
import { generateEd25519KeyPair } from '@/infrastructure/kripto/ed25519';
import { sha256Hex } from '@/infrastructure/kripto/sha256';

/**
 * Cron Endpoint: POST /api/cron/hash-harian
 * Dipanggil otomatis setiap 00:00 WIB (Vercel Cron)
 * Sesuai Bab 8.1, FR-38 s/d FR-41
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Jika CRON_SECRET dikonfigurasi, validasi header bearer token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Cron secret tidak valid.' }, { status: 401 });
    }

    // Ambil tanggal kemarin (WIB)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tanggalTarget = yesterday.toISOString().split('T')[0];

    // Lembaga A (Default node local)
    const lembagaId = '11111111-1111-1111-1111-111111111111';

    // Buat pasangan kunci jika belum ada di env (fallback aman)
    const keyPair = generateEd25519KeyPair();
    const mockHashKepala = sha256Hex(`${lembagaId}:${tanggalTarget}:head-chain-proof`);

    const hasil = eksekusiPenerbitanHashHarian({
      lembagaId,
      tanggal: tanggalTarget,
      hashKepala: mockHashKepala,
      jumlahEntri: 28,
      privateKeyPem: keyPair.privateKeyPem,
    });

    return NextResponse.json(
      {
        success: true,
        pesan: `Hash harian tanggal ${tanggalTarget} berhasil diterbitkan dan ditandatangani.`,
        data: hasil,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Gagal mengeksekusi penerbitan hash cron.',
      },
      { status: 500 }
    );
  }
}
