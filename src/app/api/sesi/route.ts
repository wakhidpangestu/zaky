import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Status sesi untuk navigasi publik.
 *
 * Halaman publik (/verifikasi, /silang, /docs) adalah komponen klien yang
 * tidak dapat membaca cookie sesi httpOnly, sehingga navbar-nya selalu
 * menampilkan tombol "Masuk Amil" walaupun pengunjung sudah masuk - terasa
 * seperti ter-logout. Endpoint ini menjawab status sesi yang sebenarnya
 * (tanpa membocorkan isi token) agar navbar dapat menampilkan jalan kembali
 * ke konsol sesuai peran.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'tidak-dikenal';
  const rate = checkRateLimit(`sesi:${ip}`, 120, 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { masuk: false, error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    );
  }

  const sesi = await getSession();
  if (!sesi) {
    return NextResponse.json(
      { masuk: false },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    {
      masuk: true,
      nama: sesi.nama,
      peran: sesi.peran,
      tujuan: sesi.peran === 'penyetuju' ? '/persetujuan' : '/dasbor',
      label: sesi.peran === 'penyetuju' ? 'Ke Persetujuan' : 'Ke Dasbor',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
