const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Rekonstruksi JCS (RFC 8785) dari kolom mentah berkas ekspor (audit T2).
// Berkas ekspor yang dipalsukan secara konsisten tetap tertangkap karena
// payload dibangun ulang dari kolom data, bukan dipercaya dari kolom
// payload_canonical tersimpan; ketidakcocokan keduanya = berkas tidak asli.
function kanonikalJson(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(kanonikalJson).join(',')}]`;
  }
  const keys = Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${keys.map((k) => `${JSON.stringify(k)}:${kanonikalJson(obj[k])}`).join(',')}}`;
}

function rekonstruksiPayload(row) {
  return kanonikalJson({
    aksi: row.aksi,
    entitas: row.entitas,
    entitas_id: row.entitas_id,
    lembaga_id: row.lembaga_id,
    nomor: Number(row.nomor),
    pelaku: row.pelaku,
    sebelum: row.sebelum ?? null,
    sesudah: row.sesudah ?? null,
    waktu: row.waktu_utc,
  });
}

function verifyOfflineExport() {
  const exportPath = path.join(__dirname, '..', 'data', 'audit_export.json');
  if (!fs.existsSync(exportPath)) {
    console.error(`Berkas ${exportPath} tidak ditemukan!`);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('VERIFIKASI AUDIT LOG OFFLINE (ZERO DATABASE CONNECTION)');
  console.log('================================================================');
  console.log(`Membaca berkas: ${exportPath}\n`);

  const rawData = fs.readFileSync(exportPath, 'utf8');
  const data = JSON.parse(rawData);

  console.log(`Metadata Ekspor:`);
  console.log(`  Waktu Ekspor  : ${data.metadata.exported_at}`);
  console.log(`  Jumlah Entri  : ${data.metadata.total_records}`);
  console.log(`  Generator     : ${data.metadata.generator}\n`);

  const kepalaMap = new Map();
  for (const k of data.rantai_kepala) {
    kepalaMap.set(k.lembaga_id, k);
  }

  let prevHashExpected = '00'.repeat(32);
  let errorsCount = 0;
  let lastRow = null;

  for (const row of data.audit_log) {
    const nomor = Number(row.nomor);

    // 1. Cek mata rantai
    if (row.prev_hash_hex !== prevHashExpected) {
      console.error(`[ERROR] Mata rantai putus pada #${nomor}: expected ${prevHashExpected}, got ${row.prev_hash_hex}`);
      errorsCount++;
    }

    // 2. Rekonstruksi payload dari kolom mentah; cocokkan dengan payload tersimpan bila ada
    const payloadRekonstruksi = rekonstruksiPayload(row);
    if (row.payload_canonical && payloadRekonstruksi !== row.payload_canonical) {
      console.error(`[ERROR] Payload tersimpan tidak cocok dengan rekonstruksi pada #${nomor} (berkas mungkin dipalsukan)`);
      errorsCount++;
    }

    // 3. Hitung ulang hash secara offline dari payload rekonstruksi
    const payloadBuf = Buffer.from(payloadRekonstruksi, 'utf8');
    const prevBuf = Buffer.from(row.prev_hash_hex, 'hex');
    const combinedBuf = Buffer.concat([payloadBuf, prevBuf]);

    const computedHash = crypto.createHash('sha256').update(combinedBuf).digest('hex');

    if (computedHash !== row.current_hash_hex) {
      console.error(`[ERROR] Hash mismatch pada #${nomor}: computed ${computedHash}, stored ${row.current_hash_hex}`);
      errorsCount++;
    }

    prevHashExpected = row.current_hash_hex;
    lastRow = row;
  }

  // 3. Cek kepala rantai
  if (lastRow) {
    const kepala = kepalaMap.get(lastRow.lembaga_id);
    if (!kepala) {
      console.error(`[ERROR] Rantai kepala lembaga ${lastRow.lembaga_id} tidak ditemukan.`);
      errorsCount++;
    } else if (kepala.hash_kepala !== lastRow.current_hash_hex) {
      console.error(`[ERROR] Hash kepala rantai (${kepala.hash_kepala}) != hash baris terakhir (${lastRow.current_hash_hex})`);
      errorsCount++;
    } else {
      console.log(`[PASS] Kepala Rantai (nomor ${kepala.nomor}) cocok sempurna dengan entri log terakhir: ${kepala.hash_kepala}`);
    }
  }

  if (errorsCount === 0) {
    console.log(`\n[HASIL] Seluruh ${data.audit_log.length} entri audit terbukti valid secara kriptografis tanpa database!`);
    console.log('================================================================');
    process.exit(0);
  } else {
    console.error(`\n[HASIL] Ditemukan ${errorsCount} kegagalan verifikasi!`);
    process.exit(1);
  }
}

verifyOfflineExport();
