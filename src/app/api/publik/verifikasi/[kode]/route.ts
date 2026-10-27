import { NextRequest, NextResponse } from 'next/server';
import { getSavedPenyaluran } from '@/lib/store';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Public Endpoint: GET /api/publik/verifikasi/[kode]
 * Sesuai Bab 10.1, Bab 10.3, FR-56 s/d FR-58
 * Akses publik dengan perlindungan privasi PDP (UU 27/2022)
 *
 * Perbaikan audit T3: endpoint ini TIDAK lagi mengarang bukti kriptografis.
 * Hash yang ditampilkan adalah hash yang tersimpan pada catatan penyaluran,
 * dan status kesaksian silang diturunkan dari data saksi/status yang nyata.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kode: string }> }
) {
  // Rate limiting endpoint publik (audit S7)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'tidak-dikenal';
  const rate = checkRateLimit(`publik-verifikasi:${ip}`, 60, 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { valid: false, error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    );
  }

  const { kode } = await context.params;
  const cleanKode = kode.trim().toUpperCase();

  const allItems = getSavedPenyaluran();
  const item = allItems.find((p) => p.kodeUnik.toUpperCase() === cleanKode);

  if (!item) {
    return NextResponse.json(
      {
        valid: false,
        error: `Kode verifikasi '${cleanKode}' tidak ditemukan dalam ledger jaringan antarlembaga.`,
      },
      { status: 404 }
    );
  }

  // Pseudonymized data per UU 27/2022 PDP
  const inisialNama = item.mustahikNama
    .split(' ')
    .map((s, idx) => (idx === 0 ? s : s.charAt(0) + '***'))
    .join(' ');

  // Status kesaksian diturunkan dari data nyata, bukan klaim tetap:
  // - metode saksi: butuh dua saksi tercatat
  // - metode mustahik: konfirmasi penerima tercatat lewat status alur
  let statusSaksiSilang: string;
  if (item.metode === 'saksi') {
    const jumlahSaksi = [item.saksi1Nama, item.saksi2Nama].filter(Boolean).length;
    statusSaksiSilang =
      jumlahSaksi >= 2
        ? 'Disaksikan 2 saksi antarlembaga (tercatat)'
        : `Kesaksian belum lengkap (${jumlahSaksi}/2 saksi tercatat)`;
  } else if (['dikonfirmasi', 'disetujui', 'tersalurkan'].includes(item.status)) {
    statusSaksiSilang = 'Dikonfirmasi langsung oleh penerima manfaat (tercatat)';
  } else {
    statusSaksiSilang = `Belum terkonfirmasi (status saat ini: ${item.status})`;
  }

  return NextResponse.json(
    {
      valid: true,
      kode_unik: item.kodeUnik,
      pos_dana: item.posNama,
      asnaf: item.asnaf,
      nominal: item.nominal,
      status: item.status,
      metode_konfirmasi: item.metode,
      waktu_pengajuan: item.dibuatPada,
      penerima_samaran: inisialNama,
      bukti_kriptografis: {
        // Hash tersimpan pada catatan; tidak dihitung ulang dari pola string
        hash_transaksi: item.hashSha256 ?? null,
        algoritma: 'SHA-256 / Ed25519',
        status_saksi_silang: statusSaksiSilang,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    }
  );
}
