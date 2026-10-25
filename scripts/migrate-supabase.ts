import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL atau POSTGRES_URL belum diatur di environment variable.');
    process.exit(1);
  }

  console.log('🔄 Menghubungkan ke Supabase PostgreSQL database...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  console.log('✅ Terhubung ke database Supabase!');

  const migrationFiles = [
    '001_initial_schema.sql',
    '002_seed_demo.sql',
    '003_stored_procedures.sql',
  ];

  try {
    for (const file of migrationFiles) {
      const filePath = path.join(process.cwd(), 'db', 'migrations', file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Berkas migrasi tidak ditemukan: ${filePath}`);
        continue;
      }

      console.log(`🚀 Menjalankan migrasi: ${file}...`);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      await client.query(sqlContent);
      console.log(`✅ Berhasil menerapkan ${file}!`);
    }

    console.log('\n🎉 SEMUA MIGRASI SUPABASE BERHASIL DIJALANKAN!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat migrasi:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
