const { Client } = require('pg');
const crypto = require('crypto');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:uji@localhost:5432/postgres'
  });

  await client.connect();

  console.log('=== MEMULAI VERIFIKASI RANTAI AUDIT INDEPENDEN (NODE.JS) ===');

  // 1. Ambil rantai_kepala
  const resKepala = await client.query('SELECT lembaga_id, nomor, encode(hash_kepala, \'hex\') as hash_kepala FROM rantai_kepala;');
  const kepalaMap = new Map();
  for (const r of resKepala.rows) {
    kepalaMap.set(r.lembaga_id, r);
  }

  // 2. Ambil seluruh audit_log beserta format payload yang dibaca langsung
  const query = `
    SELECT 
      nomor,
      lembaga_id,
      entitas,
      entitas_id,
      aksi,
      pelaku,
      sebelum,
      sesudah,
      to_char(waktu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as waktu_utc,
      encode(hash_sebelumnya, 'hex') as prev_hash_hex,
      encode(hash_saat_ini, 'hex') as current_hash_hex,
      json_build_object(
        'aksi', aksi,
        'entitas', entitas,
        'entitas_id', entitas_id,
        'lembaga_id', lembaga_id,
        'nomor', nomor,
        'pelaku', pelaku,
        'sebelum', sebelum,
        'sesudah', sesudah,
        'waktu', to_char(waktu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
      )::text as payload_canonical
    FROM audit_log
    ORDER BY nomor ASC;
  `;

  const resLogs = await client.query(query);
  console.log(`Ditemukan ${resLogs.rows.length} entri audit_log.`);

  let chainValid = true;
  let prevHashExpected = '00'.repeat(32);
  let lastRow = null;

  for (const row of resLogs.rows) {
    // a. Sambungan rantai: hash_sebelumnya harus sama dengan hash_saat_ini baris sebelumnya
    const linkMatch = (row.prev_hash_hex === prevHashExpected);
    if (!linkMatch) {
      console.error(`[ERROR] Sambungan rantai terputus pada nomor ${row.nomor}!`);
      console.error(`  Tersimpan : ${row.prev_hash_hex}`);
      console.error(`  Diharapkan: ${prevHashExpected}`);
      chainValid = false;
    }

    // b. Hitung ulang hash menggunakan algoritma SHA-256 di Node.js
    const payloadBuf = Buffer.from(row.payload_canonical, 'utf8');
    const prevBuf = Buffer.from(row.prev_hash_hex, 'hex');
    const combinedBuf = Buffer.concat([payloadBuf, prevBuf]);

    const nodeComputedHash = crypto.createHash('sha256').update(combinedBuf).digest('hex');
    const hashMatch = (nodeComputedHash === row.current_hash_hex);

    if (!hashMatch) {
      console.error(`[ERROR] Hash tidak cocok pada entri nomor ${row.nomor} (${row.aksi})!`);
      console.error(`  Dihitung Node.js: ${nodeComputedHash}`);
      console.error(`  Tersimpan di DB : ${row.current_hash_hex}`);
      chainValid = false;
    } else {
      console.log(`[PASS] Log #${row.nomor.toString().padStart(2, ' ')} | Aksi: ${row.aksi.padEnd(26, ' ')} | Hash Match: YA | Sambungan: YA`);
    }

    prevHashExpected = row.current_hash_hex;
    lastRow = row;
  }

  // c. Verifikasi ujung rantai terhadap rantai_kepala
  if (lastRow) {
    const kepala = kepalaMap.get(lastRow.lembaga_id);
    if (!kepala) {
      console.error(`[ERROR] Tidak ditemukan rantai_kepala untuk lembaga ${lastRow.lembaga_id}`);
      chainValid = false;
    } else if (kepala.hash_kepala !== lastRow.current_hash_hex) {
      console.error(`[ERROR] Hash kepala rantai (${kepala.hash_kepala}) tidak cocok dengan hash baris terakhir (${lastRow.current_hash_hex})!`);
      chainValid = false;
    } else {
      console.log(`[PASS] Kepala Rantai (nomor ${kepala.nomor}) cocok sempurna dengan entri log terakhir: ${kepala.hash_kepala}`);
    }
  }

  await client.end();

  if (chainValid) {
    console.log('\n=== KESIMPULAN: SELURUH RANTAI AUDIT TELAH DIVERIFIKASI SECARA INDEPENDEN OLEH RUNTIME NODE.JS (100% VALID) ===');
    process.exit(0);
  } else {
    console.error('\n=== KESIMPULAN: VERIFIKASI RANTAI AUDIT GAGAL ===');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
