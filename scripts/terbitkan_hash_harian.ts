import { Client } from 'pg';
import crypto from 'crypto';
import { jcsBuffer, kanonikalJson } from '../src/infrastructure/kripto/jcs.ts';
import { generateEd25519KeyPair, signEd25519, verifyEd25519 } from '../src/infrastructure/kripto/ed25519.ts';

const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:uji@localhost:5432/postgres';
const LEMBAGA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('================================================================');
  console.log('IMPLEMENTASI HASH HARIAN & TANDA TANGAN DIGITAL ED25519 (PILIHAN 1)');
  console.log('================================================================\n');

  // 1. Bangkitkan pasangan kunci Ed25519 untuk Lembaga A
  console.log('1. Membangkitkan pasangan kunci Ed25519 resmi Lembaga A...');
  const keyPair = generateEd25519KeyPair();
  console.log(`   Public Key (Hex 32-byte) : ${keyPair.publicKeyHex}`);

  // Simpan public key resmi ke tabel lembaga
  await client.query(`
    UPDATE lembaga 
    SET kunci_publik_ed25519 = decode('${keyPair.publicKeyHex}', 'hex')
    WHERE id = '${LEMBAGA_ID}';
  `);
  console.log('   ✓ Kunci publik terdaftar di tabel lembaga.');

  // 2. Baca kondisi rantai kepala terkini
  const rkRes = await client.query(`
    SELECT nomor, encode(hash_kepala, 'hex') as hash_kepala_hex, lembaga_id
    FROM rantai_kepala 
    WHERE lembaga_id = '${LEMBAGA_ID}';
  `);
  if (rkRes.rows.length === 0) {
    throw new Error('Rantai kepala lembaga tidak ditemukan');
  }
  const rk = rkRes.rows[0];
  const tanggalHariIni = '2026-10-25'; // Tanggal audit saat ini

  console.log(`\n2. Membaca status kepala rantai lembaga:`);
  console.log(`   Nomor Blok Terakhir : ${rk.nomor}`);
  console.log(`   Hash Kepala         : ${rk.hash_kepala_hex}`);
  console.log(`   Tanggal Penerbitan  : ${tanggalHariIni}`);

  // 3. Bentuk Payload JCS Kanonikal (RFC 8785)
  const payloadObj = {
    hash_kepala: rk.hash_kepala_hex,
    kunci_id: `kunci-${LEMBAGA_ID.substring(0, 8)}-2026`,
    lembaga_id: rk.lembaga_id,
    nomor: Number(rk.nomor),
    tanggal: tanggalHariIni,
  };

  const payloadJcsStr = kanonikalJson(payloadObj);
  const payloadJcsBuf = jcsBuffer(payloadObj);

  console.log(`\n3. Serialisasi JCS RFC 8785:`);
  console.log(`   Canonical JSON: ${payloadJcsStr}`);

  // 4. Tandatangani secara digital dengan Ed25519 Private Key
  console.log(`\n4. Menandatangani payload dengan Private Key Ed25519 Lembaga...`);
  const signatureBuf = signEd25519(payloadJcsBuf, keyPair.privateKeyPem);
  const signatureHex = signatureBuf.toString('hex');
  console.log(`   Signature (Hex 64-byte): ${signatureHex}`);

  // 5. Terbitkan ke tabel hash_harian
  await client.query(`
    INSERT INTO hash_harian (
      lembaga_id, tanggal, payload_jcs, hash_kepala, tanda_tangan, kunci_id, diterbitkan_pada
    ) VALUES (
      $1, $2, $3, decode($4, 'hex'), $5, $6, now()
    )
    ON CONFLICT (lembaga_id, tanggal) DO UPDATE SET
      payload_jcs = EXCLUDED.payload_jcs,
      hash_kepala = EXCLUDED.hash_kepala,
      tanda_tangan = EXCLUDED.tanda_tangan,
      kunci_id = EXCLUDED.kunci_id,
      diterbitkan_pada = now();
  `, [
    LEMBAGA_ID,
    tanggalHariIni,
    payloadJcsBuf,
    rk.hash_kepala_hex,
    signatureBuf,
    payloadObj.kunci_id,
  ]);
  console.log('   ✓ Hash harian berhasil diterbitkan dan disimpan ke tabel hash_harian.');

  // --------------------------------------------------------------------------
  // 6. PROSEDUR VERIFIKASI INDEPENDEN PUBLIKASI HASH HARIAN
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('VERIFIKASI TANDA TANGAN & ANCHORING HASH HARIAN');
  console.log('================================================================\n');

  // Baca hash_harian dan kunci publik lembaga dari basis data
  const verifyRes = await client.query(`
    SELECT 
      hh.tanggal,
      hh.payload_jcs,
      encode(hh.hash_kepala, 'hex') as hash_kepala_hex,
      encode(hh.tanda_tangan, 'hex') as signature_hex,
      hh.kunci_id,
      hh.diterbitkan_pada,
      encode(l.kunci_publik_ed25519, 'hex') as pubkey_hex
    FROM hash_harian hh
    JOIN lembaga l ON l.id = hh.lembaga_id
    WHERE hh.lembaga_id = '${LEMBAGA_ID}' AND hh.tanggal = '${tanggalHariIni}';
  `);

  if (verifyRes.rows.length === 0) {
    throw new Error('Data hash_harian tidak ditemukan saat verifikasi!');
  }

  const vRow = verifyRes.rows[0];
  console.log(`Data Publikasi Ditemukan:`);
  console.log(`  Lembaga Public Key : ${vRow.pubkey_hex}`);
  console.log(`  Payload JCS        : ${vRow.payload_jcs.toString('utf8')}`);
  console.log(`  Tanda Tangan Hex   : ${vRow.signature_hex}`);

  // a. Verifikasi Tanda Tangan Asli
  const isValidSig = verifyEd25519(vRow.payload_jcs, vRow.signature_hex, vRow.pubkey_hex);
  console.log(`\n  a. Verifikasi Tanda Tangan Ed25519 Lembaga : ${isValidSig ? 'SAH / VALID (✓)' : 'TIDAK VALID (✗)'}`);
  if (!isValidSig) {
    throw new Error('Verifikasi tanda tangan Ed25519 gagal!');
  }

  // b. Verifikasi Kesesuaian Kepala Rantai dengan Ujung Log
  const logTail = (await client.query(`SELECT encode(hash_saat_ini, 'hex') as h FROM audit_log ORDER BY nomor DESC LIMIT 1;`)).rows[0].h;
  const isHeadMatched = (vRow.hash_kepala_hex === logTail);
  console.log(`  b. Kesesuaian dengan Ujung Log Audit     : ${isHeadMatched ? 'COCOK SEMPURNA (✓)' : 'TIDAK COCOK (✗)'}`);
  if (!isHeadMatched) {
    throw new Error('Hash kepala harian tidak cocok dengan ujung log!');
  }

  // c. Uji Negatif: Modifikasi 1 karakter payload
  const tamperedPayload = Buffer.from(vRow.payload_jcs.toString('utf8').replace(rk.hash_kepala_hex, '00'.repeat(32)), 'utf8');
  const isTamperedValid = verifyEd25519(tamperedPayload, vRow.signature_hex, vRow.pubkey_hex);
  console.log(`  c. Uji Negatif Modifikasi Payload        : ${!isTamperedValid ? 'TERDETEKSI & DITOLAK (✓)' : 'GAGAL MENDETEKSI (✗)'}`);
  if (isTamperedValid) {
    throw new Error('Tanda tangan seharusnya ditolak pada payload palsu!');
  }

  await client.end();
  console.log('\n================================================================');
  console.log('KESIMPULAN: IMPLEMENTASI MINIMAL HASH HARIAN BERHASIL 100%');
  console.log('Kepala rantai audit harian terbukti dapat diterbitkan,');
  console.log('ditandatangani secara kriptografis (Ed25519), dan diverifikasi.');
  console.log('================================================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
