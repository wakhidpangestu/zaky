import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

/**
 * Menjalankan db/migrations/NNN_*.sql berurutan ke DATABASE_URL (Supabase/PostgreSQL).
 * Setiap berkas yang berhasil dicatat di tabel schema_migrations, sehingga perintah ini
 * aman dijalankan ulang: berkas yang sudah diterapkan dilewati.
 *
 *   npm run db:migrate                       # terapkan yang belum
 *   npm run db:migrate -- --baseline=003     # DB lama tanpa pencatatan: tandai 001..003 sudah ada
 *   npm run db:migrate -- --dry-run          # tampilkan rencana saja
 *
 * 002_seed_demo.sql dan 007_demo_activity.sql berisi DATA DEMO. Untuk lembaga sungguhan,
 * jalankan dengan --skip-demo agar keduanya dicatat tanpa dieksekusi.
 */
const args = process.argv.slice(2);
const flag = (name: string) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const baseline = flag('baseline')?.split('=')[1];
const dryRun = !!flag('dry-run');
const skipDemo = !!flag('skip-demo');
const DEMO = new Set(['002_seed_demo.sql', '007_demo_activity.sql']);

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL atau POSTGRES_URL belum diatur di environment variable.');
    process.exit(1);
  }
  const dir = path.join(process.cwd(), 'db', 'migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort();

  const local = /localhost|127\.0\.0\.1/.test(connectionString);
  const pool = new Pool({ connectionString, ssl: local ? false : { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         nama text PRIMARY KEY,
         diterapkan_pada timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const applied = new Set(
      (await client.query<{ nama: string }>('SELECT nama FROM schema_migrations')).rows.map((r) => r.nama),
    );

    // A database migrated before this table existed must be baselined explicitly, never guessed.
    const hasSchema = (await client.query(`SELECT to_regclass('public.lembaga') IS NOT NULL AS ada`)).rows[0].ada;
    if (!applied.size && hasSchema && !baseline) {
      console.error(
        '❌ Skema sudah ada tetapi belum tercatat di schema_migrations.\n' +
          '   Tentukan migrasi terakhir yang sudah diterapkan, misalnya: npm run db:migrate -- --baseline=003',
      );
      process.exit(1);
    }
    if (baseline) {
      for (const f of files.filter((f) => f.slice(0, 3) <= baseline && !applied.has(f))) {
        if (!dryRun) await client.query('INSERT INTO schema_migrations (nama) VALUES ($1)', [f]);
        applied.add(f);
        console.log(`📌 Ditandai sudah diterapkan: ${f}`);
      }
    }

    const pending = files.filter((f) => !applied.has(f));
    if (!pending.length) return console.log('✅ Semua migrasi sudah diterapkan.');
    for (const file of pending) {
      if (skipDemo && DEMO.has(file)) {
        console.log(`⏭️  Data demo dilewati: ${file}`);
        if (!dryRun) await client.query('INSERT INTO schema_migrations (nama) VALUES ($1)', [file]);
        continue;
      }
      console.log(`🚀 ${dryRun ? '[rencana] ' : ''}Menerapkan ${file}...`);
      if (dryRun) continue;
      await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (nama) VALUES ($1)', [file]);
    }
    console.log(dryRun ? '\nRencana selesai, tidak ada yang diubah.' : '\n🎉 Migrasi selesai.');
  } catch (error) {
    console.error('❌ Migrasi berhenti:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
