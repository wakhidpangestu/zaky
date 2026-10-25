const { Client } = require('pg');
const crypto = require('crypto');

const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:uji@localhost:5432/postgres';

async function verifyAuditChain(client) {
  const resKepala = await client.query('SELECT lembaga_id, nomor, encode(hash_kepala, \'hex\') as hash_kepala FROM rantai_kepala;');
  const kepalaMap = new Map();
  for (const r of resKepala.rows) {
    kepalaMap.set(r.lembaga_id, r);
  }

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

  let chainValid = true;
  let prevHashExpected = '00'.repeat(32);
  let lastRow = null;
  const errors = [];

  for (const row of resLogs.rows) {
    const nomor = Number(row.nomor);
    if (row.prev_hash_hex !== prevHashExpected) {
      errors.push({
        type: 'LINK_BROKEN',
        nomor: nomor,
        detail: `Sambungan rantai terputus pada nomor ${nomor}! Diharapkan ${prevHashExpected}, didapat ${row.prev_hash_hex}`
      });
      chainValid = false;
    }

    const payloadBuf = Buffer.from(row.payload_canonical, 'utf8');
    const prevBuf = Buffer.from(row.prev_hash_hex, 'hex');
    const combinedBuf = Buffer.concat([payloadBuf, prevBuf]);

    const nodeComputedHash = crypto.createHash('sha256').update(combinedBuf).digest('hex');
    if (nodeComputedHash !== row.current_hash_hex) {
      errors.push({
        type: 'HASH_MISMATCH',
        nomor: nomor,
        detail: `Hash tidak cocok pada entri nomor ${nomor} (${row.aksi})! Dihitung ${nodeComputedHash}, tersimpan ${row.current_hash_hex}`
      });
      chainValid = false;
    }

    prevHashExpected = row.current_hash_hex;
    lastRow = row;
  }

  if (lastRow) {
    const kepala = kepalaMap.get(lastRow.lembaga_id);
    if (!kepala || kepala.hash_kepala !== lastRow.current_hash_hex) {
      errors.push({
        type: 'HEAD_MISMATCH',
        nomor: Number(lastRow.nomor),
        detail: `Kepala rantai tidak cocok dengan baris terakhir!`
      });
      chainValid = false;
    }
  }

  return { isValid: chainValid, totalRows: resLogs.rows.length, errors };
}

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('================================================================');
  console.log('UJI NEGATIF VERIFIKATOR RANTAI AUDIT INDEPENDEN');
  console.log('================================================================\n');

  // Baseline Check
  const baseline = await verifyAuditChain(client);
  console.log(`1. Baseline Check (${baseline.totalRows} entri): ${baseline.isValid ? 'VALID 100%' : 'GAGAL'}`);
  if (!baseline.isValid) {
    console.error('Baseline tidak valid! Perbaiki database terlebih dahulu.');
    process.exit(1);
  }

  // Disable trigger append-only sementara untuk mensimulasikan serangan modifikasi DBA
  await client.query('ALTER TABLE audit_log DISABLE TRIGGER trg_audit_log_append_only;');

  try {
    // ------------------------------------------------------------------------
    // TEST NEGATIF 1: Modifikasi Payload Entri (Simulasi Pengubahan Data Historis)
    // ------------------------------------------------------------------------
    const targetNomor1 = 5;
    const orig1 = (await client.query(`SELECT aksi FROM audit_log WHERE nomor = ${targetNomor1};`)).rows[0];
    console.log(`\n2. Uji Negatif 1: Memalsukan kolom 'aksi' pada entri nomor ${targetNomor1}...`);

    await client.query(`UPDATE audit_log SET aksi = 'AKSI_PALSU_ILLEGAL' WHERE nomor = ${targetNomor1};`);

    const resNeg1 = await verifyAuditChain(client);
    const caught1 = resNeg1.errors.find(e => e.type === 'HASH_MISMATCH' && e.nomor === targetNomor1);

    if (!resNeg1.isValid && caught1) {
      console.log(`   [PASS] Serangan terdeteksi dengan tepat!`);
      console.log(`   Pesan deteksi: ${caught1.detail}`);
    } else {
      console.error(`   [FAIL] Verifikator gagal mendeteksi pemalsuan data pada baris ${targetNomor1}!`);
      process.exit(1);
    }

    // Kembalikan ke nilai asli
    await client.query(`UPDATE audit_log SET aksi = '${orig1.aksi}' WHERE nomor = ${targetNomor1};`);
    const restore1 = await verifyAuditChain(client);
    console.log(`   Pemulihan baris ${targetNomor1}: ${restore1.isValid ? 'RANTAI PULIH DAN VALID' : 'GAGAL'}`);

    // ------------------------------------------------------------------------
    // TEST NEGATIF 2: Pemutusan Mata Rantai (Simulasi Manipulasi hash_sebelumnya)
    // ------------------------------------------------------------------------
    const targetNomor2 = 10;
    const orig2 = (await client.query(`SELECT encode(hash_sebelumnya, 'hex') as h FROM audit_log WHERE nomor = ${targetNomor2};`)).rows[0];
    console.log(`\n3. Uji Negatif 2: Memalsukan 'hash_sebelumnya' pada entri nomor ${targetNomor2}...`);

    const fakeHash = 'ab'.repeat(32);
    await client.query(`UPDATE audit_log SET hash_sebelumnya = decode('${fakeHash}', 'hex') WHERE nomor = ${targetNomor2};`);

    const resNeg2 = await verifyAuditChain(client);
    const caught2 = resNeg2.errors.find(e => e.type === 'LINK_BROKEN' && e.nomor === targetNomor2);

    if (!resNeg2.isValid && caught2) {
      console.log(`   [PASS] Pemutusan mata rantai terdeteksi dengan tepat!`);
      console.log(`   Pesan deteksi: ${caught2.detail}`);
    } else {
      console.error(`   [FAIL] Verifikator gagal mendeteksi pemutusan rantai pada baris ${targetNomor2}!`);
      process.exit(1);
    }

    // Kembalikan ke nilai asli
    await client.query(`UPDATE audit_log SET hash_sebelumnya = decode('${orig2.h}', 'hex') WHERE nomor = ${targetNomor2};`);
    const restore2 = await verifyAuditChain(client);
    console.log(`   Pemulihan baris ${targetNomor2}: ${restore2.isValid ? 'RANTAI PULIH DAN VALID' : 'GAGAL'}`);

    // ------------------------------------------------------------------------
    // TEST NEGATIF 3: Manipulasi Kepala Rantai (Simulasi Pemalsuan Head Hash)
    // ------------------------------------------------------------------------
    console.log(`\n4. Uji Negatif 3: Memalsukan hash di tabel rantai_kepala...`);
    const origKepala = (await client.query(`SELECT encode(hash_kepala, 'hex') as h, lembaga_id FROM rantai_kepala LIMIT 1;`)).rows[0];

    const fakeHead = 'ff'.repeat(32);
    await client.query(`UPDATE rantai_kepala SET hash_kepala = decode('${fakeHead}', 'hex') WHERE lembaga_id = '${origKepala.lembaga_id}';`);

    const resNeg3 = await verifyAuditChain(client);
    const caught3 = resNeg3.errors.find(e => e.type === 'HEAD_MISMATCH');

    if (!resNeg3.isValid && caught3) {
      console.log(`   [PASS] Ketidakcocokan kepala rantai terdeteksi dengan tepat!`);
      console.log(`   Pesan deteksi: ${caught3.detail}`);
    } else {
      console.error(`   [FAIL] Verifikator gagal mendeteksi pemalsuan kepala rantai!`);
      process.exit(1);
    }

    // Kembalikan ke nilai asli
    await client.query(`UPDATE rantai_kepala SET hash_kepala = decode('${origKepala.h}', 'hex') WHERE lembaga_id = '${origKepala.lembaga_id}';`);
    const restore3 = await verifyAuditChain(client);
    console.log(`   Pemulihan kepala rantai: ${restore3.isValid ? 'RANTAI PULIH DAN VALID' : 'GAGAL'}`);

  } finally {
    // Pastikan trigger proteksi append-only selalu diaktifkan kembali
    await client.query('ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_append_only;');
    console.log('\n[SEC] Trigger trg_audit_log_append_only telah diaktifkan kembali.');
  }

  await client.end();
  console.log('\n================================================================');
  console.log('KESIMPULAN: SELURUH UJI NEGATIF LOLOS 100%');
  console.log('Verifikator terbukti menolak manipulasi data, pemutusan rantai, dan pemalsuan kepala.');
  console.log('================================================================');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
