/**
 * Berperan sebagai Lembaga B atau C yang menyaksikan hash harian Lembaga A lewat API.
 *
 *   node scripts/kirim-kesaksian.ts --saksi=B [--target=http://localhost:3000] [--tanggal=YYYY-MM-DD] [--palsukan]
 *
 * Alur yang sama dengan instans lembaga sungguhan:
 *   1. GET  {target}/api/publik/hash-harian/{A}/{tanggal}
 *   2. Verifikasi tanda tangan Ed25519 Lembaga A memakai kunci publik dari direktori/anggota.json
 *      milik saksi sendiri (bukan dari server A).
 *   3. Tanda tangani kesaksian (JCS + Ed25519) dengan kunci saksi (ZAKY_ED25519_SEED_B/C atau kunci demo).
 *   4. POST {target}/api/jaringan/kesaksian
 *
 * --palsukan mengubah satu byte hash yang disaksikan, mensimulasikan saksi yang melihat
 * sejarah berbeda; server tetap mencatatnya dan papan silang menandainya "tidak cocok".
 * Jalankan server dengan ZAKY_SAKSI_INTERNAL=false agar kesaksian B/C tidak dibuat otomatis.
 */
import { readFileSync } from 'node:fs';
import { jcsBuffer } from '../src/infrastructure/kripto/jcs.ts';
import { verifyEd25519 } from '../src/infrastructure/kripto/ed25519.ts';
import { LEMBAGA, kunciLembaga, tandaTangani, type KodeLembaga } from '../src/lib/jaringan/kunci.ts';

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const saksi = (arg('saksi') ?? 'B').toUpperCase() as KodeLembaga;
const target = (arg('target') ?? 'http://localhost:3000').replace(/\/$/, '');
const palsukan = process.argv.includes('--palsukan');

if (saksi !== 'B' && saksi !== 'C') {
  console.error('--saksi harus B atau C (Lembaga A adalah penerbit).');
  process.exit(1);
}

/** Hari WIB terakhir yang sudah tutup buku (kemarin menurut WIB). */
function kemarinWib(): string {
  const hariIni = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  return new Date(Date.parse(hariIni) - 86_400_000).toISOString().slice(0, 10);
}
const tanggal = arg('tanggal') ?? kemarinWib();

const direktori = JSON.parse(readFileSync(new URL('../direktori/anggota.json', import.meta.url), 'utf8')) as {
  anggota: { id: string; kunci_publik_ed25519: string }[];
};
const kunciPublikA = direktori.anggota.find((a) => a.id === LEMBAGA.A.id)?.kunci_publik_ed25519;
if (!kunciPublikA) throw new Error('Kunci publik Lembaga A tidak ada di direktori/anggota.json.');

async function main() {
  console.log(`[${LEMBAGA[saksi].nama}] menyaksikan ${LEMBAGA.A.nama} untuk ${tanggal} di ${target}`);

  // 1. Ambil hash harian yang diterbitkan Lembaga A.
  const res = await fetch(`${target}/api/publik/hash-harian/${LEMBAGA.A.id}/${tanggal}`);
  const terbit = (await res.json()) as {
    error?: string;
    payload_jcs: string;
    tanda_tangan: string;
    hash_kepala: string;
    lembaga_id: string;
    tanggal: string;
  };
  if (!res.ok) throw new Error(`Hash harian tidak tersedia (${res.status}): ${terbit.error}`);

  // 2. Verifikasi mandiri: tanda tangan A dan isi payload.
  if (!verifyEd25519(Buffer.from(terbit.payload_jcs, 'utf8'), terbit.tanda_tangan, kunciPublikA!))
    throw new Error('Tanda tangan Lembaga A TIDAK sah. Kesaksian tidak dikirim.');
  if (terbit.lembaga_id !== LEMBAGA.A.id || terbit.tanggal !== tanggal)
    throw new Error('Payload hash harian tidak sesuai dengan lembaga atau tanggal yang diminta.');
  console.log(`  ✓ Tanda tangan Ed25519 Lembaga A sah. Hash kepala: ${terbit.hash_kepala}`);

  // 3. Susun dan tanda tangani kesaksian.
  let hash = terbit.hash_kepala;
  if (palsukan) {
    hash = (parseInt(hash[0], 16) ^ 1).toString(16) + hash.slice(1);
    console.log(`  ! Mode --palsukan: saksi melaporkan hash berbeda ${hash}`);
  }
  const isi = {
    saksi_lembaga_id: LEMBAGA[saksi].id,
    lembaga_id: LEMBAGA.A.id,
    tanggal,
    hash_disaksikan: hash,
    diamati_pada: new Date().toISOString(),
  };
  const tanda_tangan_saksi = tandaTangani(saksi, jcsBuffer(isi)).toString('hex');
  if (kunciLembaga(saksi).demo) console.log('  (memakai kunci DEMO; set ZAKY_ED25519_SEED_' + saksi + ' untuk kunci sungguhan)');

  // 4. Kirim ke server Lembaga A.
  const kirim = await fetch(`${target}/api/jaringan/kesaksian`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...isi, tanda_tangan_saksi }),
  });
  console.log(`  → POST /api/jaringan/kesaksian: HTTP ${kirim.status}`);
  console.log(' ', await kirim.json());
}

main().catch((error) => {
  console.error('  ✗', error instanceof Error ? error.message : error);
  process.exit(1);
});
