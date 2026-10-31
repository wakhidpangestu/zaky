import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { jcsBuffer } from '../../src/infrastructure/kripto/jcs.ts';
import { LEMBAGA, tandaTangani } from '../../src/lib/jaringan/kunci.ts';
import { terimaKesaksian } from '../../src/lib/jaringan/kesaksian-masuk.ts';
import { susunBukti, tanggalWib } from '../../src/lib/jaringan/bukti.ts';
import { verifikasiBukti } from '../../src/lib/jaringan/verifikasi-bukti.ts';

let db, q, kode, tanggal, tanggalLain;
const A = LEMBAGA.A.id;
const tutup = (t) => new Date(Date.parse(`${t}T00:00:00+07:00`) + 86_400_000);

/** Sama dengan terbitkanDanSaksikan(): kepala rantai sebelum tutup buku, ditandatangani Lembaga A. */
async function terbitkan(t) {
  const kepala = (
    await db.query('SELECT nomor, hash_saat_ini FROM audit_log WHERE lembaga_id=$1 AND waktu < $2 ORDER BY nomor DESC LIMIT 1', [A, tutup(t)])
  ).rows[0];
  const hashKepala = Buffer.from(kepala.hash_saat_ini).toString('hex');
  const payload = jcsBuffer({ hash_kepala: hashKepala, jumlah_entri: Number(kepala.nomor), lembaga_id: A, tanggal: t, versi: 1 });
  await db.query(
    `INSERT INTO hash_harian (lembaga_id, tanggal, payload_jcs, hash_kepala, tanda_tangan, kunci_id, diterbitkan_pada)
     VALUES ($1,$2,$3,$4,$5,'ed25519-v1',$6)`,
    [A, t, payload, kepala.hash_saat_ini, tandaTangani('A', payload), new Date(tutup(t).getTime() + 60_000)],
  );
  return hashKepala;
}

/** Kesaksian bertanda tangan seperti yang dikirim scripts/kirim-kesaksian.ts. */
function kesaksian(kode, t, hash, diamati = new Date()) {
  const isi = { saksi_lembaga_id: LEMBAGA[kode].id, lembaga_id: A, tanggal: t, hash_disaksikan: hash, diamati_pada: diamati.toISOString() };
  return { ...isi, tanda_tangan_saksi: tandaTangani(kode, jcsBuffer(isi)).toString('hex') };
}

before(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  for (const f of [
    '001_initial_schema.sql', '002_seed_demo.sql', '003_stored_procedures.sql', '004_office_chat.sql',
    '005_office_workflow.sql', '006_office_operations.sql', '007_demo_activity.sql', '008_jaringan_saksi.sql',
  ])
    await db.exec(await readFile(new URL('../../db/migrations/' + f, import.meta.url), 'utf8'));
  q = (text, params) => db.query(text, params);
  // Penyaluran tertua yang seluruh riwayatnya sudah lewat tutup buku.
  const row = (
    await db.query(`SELECT p.kode_unik::text AS kode, max(a.waktu) AS akhir FROM penyaluran p
      JOIN audit_log a ON a.entitas_id=p.id GROUP BY p.kode_unik ORDER BY akhir LIMIT 1`)
  ).rows[0];
  kode = row.kode;
  tanggal = tanggalWib(new Date(row.akhir));
  tanggalLain = new Date(Date.parse(tanggal) + 86_400_000).toISOString().slice(0, 10);
  assert.ok(tutup(tanggalLain).getTime() < Date.now(), 'data demo harus punya dua hari yang sudah tutup buku');
});

test('kesaksian dari instans lain: diverifikasi, disimpan sekali, dan hash berbeda tetap tercatat', async () => {
  assert.equal((await terimaKesaksian(q, kesaksian('B', tanggal, 'ab'.repeat(32)))).status, 404, 'belum terbit');
  const hash = await terbitkan(tanggal);

  const b = await terimaKesaksian(q, kesaksian('B', tanggal, hash));
  assert.equal(b.status, 201);
  assert.equal(b.body.cocok, true);
  assert.equal((await terimaKesaksian(q, kesaksian('B', tanggal, hash))).status, 409, 'replay ditolak');
  assert.equal((await terimaKesaksian(q, kesaksian('C', tanggal, hash))).status, 201);

  const palsu = kesaksian('B', tanggal, hash);
  palsu.hash_disaksikan = 'ff' + hash.slice(2);
  assert.equal((await terimaKesaksian(q, palsu)).status, 401, 'tanda tangan tidak menutupi isi yang diubah');
  assert.equal((await terimaKesaksian(q, kesaksian('B', tanggal, hash, new Date(Date.now() - 10 * 60_000)))).status, 400);
  assert.equal((await terimaKesaksian(q, { ...kesaksian('B', tanggal, hash), saksi_lembaga_id: A })).status, 422);

  // Saksi yang melihat sejarah lain: tanda tangannya sah, dicatat, dan ditandai tidak cocok.
  const hashLain = await terbitkan(tanggalLain);
  const beda = await terimaKesaksian(q, kesaksian('C', tanggalLain, 'ff' + hashLain.slice(2)));
  assert.equal(beda.status, 201);
  assert.equal(beda.body.cocok, false);
});

test('bukti publik lulus seluruh pemeriksaan di WebCrypto', async () => {
  const bukti = await susunBukti(q, kode);
  assert.equal(bukti.hash_harian?.tanggal, tanggal);
  const hasil = await verifikasiBukti(bukti);
  assert.deepEqual(
    hasil.cek.map((c) => [c.id, c.status]),
    [['rantai', 'lulus'], ['catatan', 'lulus'], ['tanda_tangan', 'lulus'], ['kepala', 'lulus'], ['kesaksian', 'lulus']],
    JSON.stringify(hasil.cek, null, 2),
  );
  assert.equal(hasil.sah, true);
  assert.equal(hasil.terikatHashHarian, true);
  assert.ok(hasil.peristiwa.some((p) => p.aksi === 'BUAT_DRAF_RESERVASI'));
});

test('perubahan apa pun pada bukti terdeteksi', async () => {
  const asli = await susunBukti(q, kode);
  const salin = () => structuredClone(asli);

  const nominal = salin();
  nominal.entri[0].payload = nominal.entri[0].payload.replace(/"nominal"\s*:\s*(\d)/, (_, d) => `"nominal": ${(Number(d) + 1) % 10}`);
  assert.notEqual(nominal.entri[0].payload, asli.entri[0].payload, 'payload contoh harus memuat nominal');
  const r1 = await verifikasiBukti(nominal);
  assert.equal(r1.cek.find((c) => c.id === 'rantai').status, 'gagal');
  assert.equal(r1.sah, false);

  const dibuang = salin();
  dibuang.entri.splice(1, 1);
  assert.equal((await verifikasiBukti(dibuang)).cek.find((c) => c.id === 'rantai').status, 'gagal');

  const ttd = salin();
  ttd.hash_harian.tanda_tangan = '00' + ttd.hash_harian.tanda_tangan.slice(2);
  assert.equal((await verifikasiBukti(ttd)).cek.find((c) => c.id === 'tanda_tangan').status, 'gagal');

  const kunci = salin();
  kunci.hash_harian.kunci_publik = asli.kesaksian[0].kunci_publik; // kunci lembaga lain
  assert.equal((await verifikasiBukti(kunci)).cek.find((c) => c.id === 'tanda_tangan').status, 'gagal');

  const saksi = salin();
  saksi.kesaksian = saksi.kesaksian.slice(0, 1);
  assert.equal((await verifikasiBukti(saksi)).cek.find((c) => c.id === 'kesaksian').status, 'gagal');
});

test('catatan dari hari yang belum tutup buku tetap dapat dihitung ulang tanpa hash harian', async () => {
  const hariIni = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  const later = tutup(hariIni).getTime() - 1;
  const bukti = await susunBukti(q, kode, later - 400 * 86_400_000);
  assert.equal(bukti.hash_harian, null);
  assert.match(bukti.keterangan, /belum ditutup/);
  const hasil = await verifikasiBukti(bukti);
  assert.equal(hasil.cek.find((c) => c.id === 'rantai').status, 'lulus');
  assert.equal(hasil.cek.find((c) => c.id === 'kesaksian').status, 'lewati');
  assert.equal(hasil.sah, true);
});

test('kode tidak dikenal ditolak dengan 404', async () => {
  await assert.rejects(susunBukti(q, 'ZK0000000000'), (e) => e.status === 404);
});

test('browser tanpa Ed25519 menandai tanda tangan "lewati", bukan "gagal"', async () => {
  const bukti = await susunBukti(q, kode);
  const subtle = crypto.subtle;
  const tanpaEd25519 = {
    digest: subtle.digest.bind(subtle),
    importKey: async () => {
      throw new DOMException('Algorithm: Unrecognized name', 'NotSupportedError');
    },
    verify: subtle.verify.bind(subtle),
  };
  const hasil = await verifikasiBukti(bukti, tanpaEd25519);
  assert.equal(hasil.cek.find((c) => c.id === 'rantai').status, 'lulus');
  assert.equal(hasil.cek.find((c) => c.id === 'tanda_tangan').status, 'lewati');
  assert.equal(hasil.cek.find((c) => c.id === 'kesaksian').status, 'lewati');
  assert.equal(hasil.terikatHashHarian, false);
});
