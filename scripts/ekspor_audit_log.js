const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:uji@localhost:5432/postgres';

async function exportAuditLog() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('Mengekspor data audit_log dan rantai_kepala ke berkas JSON...');

  const resKepala = await client.query('SELECT lembaga_id, nomor, encode(hash_kepala, \'hex\') as hash_kepala FROM rantai_kepala;');
  
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

  const exportData = {
    metadata: {
      exported_at: new Date().toISOString(),
      total_records: resLogs.rows.length,
      generator: 'Zaky Audit Exporter v1.0'
    },
    rantai_kepala: resKepala.rows,
    audit_log: resLogs.rows
  };

  const targetDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetFile = path.join(targetDir, 'audit_export.json');
  fs.writeFileSync(targetFile, JSON.stringify(exportData, null, 2), 'utf8');

  console.log(`Berhasil mengekspor ${resLogs.rows.length} entri audit ke: ${targetFile}`);
  await client.end();
}

exportAuditLog().catch(err => {
  console.error('Gagal mengekspor:', err);
  process.exit(1);
});
