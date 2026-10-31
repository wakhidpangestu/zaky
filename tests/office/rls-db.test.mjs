import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
let db;
const a = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  budi = '11111111-1111-1111-1111-111111111111',
  pos = 'c1111111-1111-1111-1111-111111111111';
before(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  // Peran publik Supabase, dengan grant bawaan seperti di proyek Supabase baru.
  await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;`);
  for (const f of [
    '001_initial_schema.sql',
    '002_seed_demo.sql',
    '003_stored_procedures.sql',
    '004_office_chat.sql',
    '005_office_workflow.sql',
    '006_office_operations.sql',
    '008_jaringan_saksi.sql',
    '009_rls_tabel_inti.sql',
  ])
    await db.exec(await readFile(new URL('../../db/migrations/' + f, import.meta.url), 'utf8'));
});
test('every public table has RLS enabled after 009', async () => {
  const { rows } = await db.query(
    "SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND NOT relrowsecurity",
  );
  assert.deepEqual(rows, []);
});
for (const role of ['anon', 'authenticated'])
  test(`${role} cannot read core tables or call stored procedures`, async () => {
    for (const sql of [
      'SELECT * FROM akun',
      'SELECT * FROM mustahik',
      'SELECT * FROM audit_log',
      'SELECT * FROM penyaluran',
      "UPDATE pos_dana SET saldo_tersedia=0",
      `SELECT catat_penerimaan('${a}','${pos}',1000,0,'tunai','${budi}','x')`,
    ])
      await assert.rejects(
        db.transaction(async (tx) => {
          await tx.exec(`SET LOCAL ROLE ${role}`);
          await tx.query(sql);
        }),
        /permission denied/,
        `${role}: ${sql}`,
      );
  });
test('the application owner role keeps full access through stored procedures', async () => {
  await db.query("SELECT catat_penerimaan($1,$2,100000,0,'tunai',$3,'Uji RLS')", [a, pos, budi]);
  const { rows } = await db.query('SELECT total_masuk::text FROM pos_dana WHERE id=$1', [pos]);
  assert.equal(rows[0].total_masuk, '100000.00');
});
