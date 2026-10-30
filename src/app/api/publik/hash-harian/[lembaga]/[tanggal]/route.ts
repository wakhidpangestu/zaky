import { NextRequest, NextResponse } from 'next/server';
import { cariAnggota } from '@/infrastructure/jaringan/direktori';
import { query } from '@/lib/db';
import { terbitkanDanSaksikan } from '@/lib/jaringan/papan';

/**
 * Public Endpoint: GET /api/publik/hash-harian/[lembaga]/[tanggal]
 * Sesuai Bab 8.2 dan FR-38 s/d FR-41
 * Mengembalikan payload kanonikal JCS dan tanda tangan Ed25519 dari tabel hash_harian,
 * agar lembaga lain bisa memverifikasinya dengan kunci publik di direktori anggota.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ lembaga: string; tanggal: string }> },
) {
  const { lembaga, tanggal } = await context.params;

  const infoLembaga = cariAnggota(lembaga);
  if (!infoLembaga)
    return NextResponse.json(
      { error: `Lembaga dengan ID/kode '${lembaga}' tidak terdaftar di direktori anggota.` },
      { status: 404 },
    );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal))
    return NextResponse.json({ error: 'Format tanggal harus YYYY-MM-DD.' }, { status: 400 });

  try {
    await terbitkanDanSaksikan(tanggal);
    const row = (
      await query<{ payload_jcs: Buffer; tanda_tangan: Buffer; kunci_id: string; diterbitkan_pada: Date }>(
        'SELECT payload_jcs, tanda_tangan, kunci_id, diterbitkan_pada FROM hash_harian WHERE lembaga_id=$1 AND tanggal=$2',
        [infoLembaga.id, tanggal],
      )
    ).rows[0];
    if (!row)
      return NextResponse.json(
        { error: `${infoLembaga.nama} belum menerbitkan hash harian untuk ${tanggal} di server ini.` },
        { status: 404 },
      );
    return NextResponse.json(
      {
        ...JSON.parse(row.payload_jcs.toString('utf8')),
        payload_jcs: row.payload_jcs.toString('utf8'),
        tanda_tangan: row.tanda_tangan.toString('hex'),
        kunci_id: row.kunci_id,
        diterbitkan_pada: row.diterbitkan_pada.toISOString(),
      },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (error) {
    console.error('Hash harian gagal dimuat', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Hash harian belum bisa dimuat.' }, { status: 503 });
  }
}
