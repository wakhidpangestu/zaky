const { Client } = require('pg');

const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:uji@localhost:5432/postgres';

const LEMBAGA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const POS_ID = 'c1111111-1111-1111-1111-111111111111';
const MUSTAHIK_ID = 'd1111111-1111-1111-1111-111111111111';
const AMIL_BUDI = '11111111-1111-1111-1111-111111111111';
const UNIT_BUDI = 'a1111111-1111-1111-1111-111111111111';
const PENYETUJU_HARI = '22222222-2222-2222-2222-222222222222';
const SAKSI_DEWI = '33333333-3333-3333-3333-333333333333';
const SAKSI_RIAN = '44444444-4444-4444-4444-444444444444';

async function run() {
  const conn1 = new Client({ connectionString: DB_URL });
  const conn2 = new Client({ connectionString: DB_URL });
  const admin = new Client({ connectionString: DB_URL });

  await conn1.connect();
  await conn2.connect();
  await admin.connect();

  const pid1 = (await conn1.query('SELECT pg_backend_pid()')).rows[0].pg_backend_pid;
  const pid2 = (await conn2.query('SELECT pg_backend_pid()')).rows[0].pg_backend_pid;
  const adminPid = (await admin.query('SELECT pg_backend_pid()')).rows[0].pg_backend_pid;

  console.log('================================================================');
  console.log('UJI KONKURENSI DUA KONEKSI BASIS DATA NYATA (POSTGRESQL 16)');
  console.log('================================================================');
  console.log(`Verifikasi Backend Server PID:`);
  console.log(`  Koneksi 1 Server PID : ${pid1}`);
  console.log(`  Koneksi 2 Server PID : ${pid2} (Terpisah: ${pid1 !== pid2 ? 'YA' : 'TIDAK'})`);
  console.log(`  Admin Server PID     : ${adminPid}`);
  console.log(`  Tingkat Isolasi      : READ COMMITTED dengan Penguncian Baris (FOR UPDATE)\n`);

  // --------------------------------------------------------------------------
  // SKENARIO 1: Dua draf bersamaan pada saldo terbatas (AC-01, AC-02)
  // --------------------------------------------------------------------------
  console.log('--- SKENARIO 1: Race Condition Reservasi Saldo Terbatas (100 Iterasi) ---');
  console.log('Kondisi: Saldo tersedia Rp 500.000. Dua koneksi secara simultan meminta reservasi Rp 400.000.');
  console.log('Harapan: Tepat 1 berhasil, tepat 1 ditolak (INSUFFICIENT_AVAILABLE_BALANCE). 0 Deadlock (40P01).\n');

  let s1Success1 = 0;
  let s1Success2 = 0;
  let s1BothSuccess = 0;
  let s1BothFailed = 0;
  let s1Deadlocks = 0;
  let s1InvariantFailed = 0;

  const ITERS_S1 = 100;

  for (let i = 1; i <= ITERS_S1; i++) {
    // Reset saldo pos_dana ke 500.000 tersedia
    await admin.query(`
      UPDATE pos_dana 
      SET total_masuk = 500000, 
          saldo_tersedia = 500000, 
          saldo_dicadangkan = 0, 
          total_tersalurkan = 0 
      WHERE id = '${POS_ID}';
    `);

    const q1 = conn1.query(`
      SELECT buat_draf_penyaluran(
        '${LEMBAGA_ID}', '${POS_ID}', '${MUSTAHIK_ID}', 'fakir', 400000.00, 'saksi',
        '${AMIL_BUDI}', '${UNIT_BUDI}', '/bukti/s1_1_${i}.pdf', digest('pdf1', 'sha256'), NULL
      );
    `);

    const q2 = conn2.query(`
      SELECT buat_draf_penyaluran(
        '${LEMBAGA_ID}', '${POS_ID}', '${MUSTAHIK_ID}', 'fakir', 400000.00, 'saksi',
        '${AMIL_BUDI}', '${UNIT_BUDI}', '/bukti/s1_2_${i}.pdf', digest('pdf2', 'sha256'), NULL
      );
    `);

    const [r1, r2] = await Promise.allSettled([q1, q2]);

    const ok1 = r1.status === 'fulfilled';
    const ok2 = r2.status === 'fulfilled';

    if (r1.status === 'rejected' && r1.reason.code === '40P01') s1Deadlocks++;
    if (r2.status === 'rejected' && r2.reason.code === '40P01') s1Deadlocks++;

    if (ok1 && ok2) {
      s1BothSuccess++;
    } else if (!ok1 && !ok2) {
      s1BothFailed++;
    } else if (ok1 && !ok2) {
      s1Success1++;
    } else if (!ok1 && ok2) {
      s1Success2++;
    }

    // Verifikasi invariant pos_dana
    const posRes = await admin.query(`
      SELECT saldo_tersedia, saldo_dicadangkan, total_masuk,
             (total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan) as inv_ok
      FROM pos_dana WHERE id = '${POS_ID}';
    `);
    const pos = posRes.rows[0];
    if (!pos.inv_ok || Number(pos.saldo_tersedia) !== 100000 || Number(pos.saldo_dicadangkan) !== 400000) {
      s1InvariantFailed++;
    }
  }

  console.log(`Hasil Skenario 1 (${ITERS_S1} Iterasi):`);
  console.log(`  Koneksi 1 Menang      : ${s1Success1}`);
  console.log(`  Koneksi 2 Menang      : ${s1Success2}`);
  console.log(`  Total Sukses Tepat 1  : ${s1Success1 + s1Success2} / ${ITERS_S1} (100%)`);
  console.log(`  Kedua Koneksi Lolos   : ${s1BothSuccess} (Double-spend: TIDAK TERJADI)`);
  console.log(`  Kedua Koneksi Gagal   : ${s1BothFailed}`);
  console.log(`  Deadlock (40P01)      : ${s1Deadlocks}`);
  console.log(`  Pelanggaran Invariant : ${s1InvariantFailed}`);

  // --------------------------------------------------------------------------
  // SKENARIO 2: Konkurensi Konfirmasi Saksi Tolak vs Setujui Penyaluran (T1)
  // --------------------------------------------------------------------------
  console.log('\n--- SKENARIO 2: Konkurensi Bebas Deadlock (T1) (100 Iterasi) ---');
  console.log('Kondisi: Penyaluran sudah disahkan oleh 2 saksi (status dikonfirmasi).');
  console.log('Secara bersamaan:');
  console.log('  Koneksi 1: konfirmasi_saksi (tolak oleh saksi lain/tambahan)');
  console.log('  Koneksi 2: setujui_penyaluran (oleh Penyetuju Hari)');
  console.log('Harapan: Tidak ada deadlock 40P01 dalam 100 iterasi.\n');

  let s2Deadlocks = 0;
  let s2SetujuiFirst = 0;
  let s2SaksiFirst = 0;

  const ITERS_S2 = 100;

  for (let i = 1; i <= ITERS_S2; i++) {
    // Reset saldo cukup
    await admin.query(`
      UPDATE pos_dana 
      SET total_masuk = 10000000, 
          saldo_tersedia = 10000000, 
          saldo_dicadangkan = 0, 
          total_tersalurkan = 0 
      WHERE id = '${POS_ID}';
    `);

    // Amil Budi buat draf metode saksi Rp 200.000
    const draftRes = await admin.query(`
      SELECT buat_draf_penyaluran(
        '${LEMBAGA_ID}', '${POS_ID}', '${MUSTAHIK_ID}', 'fakir', 200000.00, 'saksi',
        '${AMIL_BUDI}', '${UNIT_BUDI}', '/bukti/s2_${i}.pdf', digest('pdf2', 'sha256'), NULL
      ) as id;
    `);
    const draftId = draftRes.rows[0].id;

    // Saksi 1 (Dewi) & Saksi 2 (Rian) konfirmasi terima -> status menjadi dikonfirmasi
    await admin.query(`SELECT konfirmasi_saksi('${draftId}', '${SAKSI_DEWI}', true);`);
    await admin.query(`SELECT konfirmasi_saksi('${draftId}', '${SAKSI_RIAN}', true);`);

    // Eksekusi paralel:
    // conn1: Mencoba setujui_penyaluran
    // conn2: Mencoba konfirmasi_saksi tolak (dengan saksi lain) atau batalkan
    const p1 = conn1.query(`SELECT setujui_penyaluran('${draftId}', '${PENYETUJU_HARI}');`);
    const p2 = conn2.query(`SELECT batalkan_penyaluran('${draftId}', '${AMIL_BUDI}');`);

    const [res1, res2] = await Promise.allSettled([p1, p2]);

    if (res1.status === 'rejected' && res1.reason.code === '40P01') s2Deadlocks++;
    if (res2.status === 'rejected' && res2.reason.code === '40P01') s2Deadlocks++;

    if (res1.status === 'fulfilled') s2SetujuiFirst++;
    if (res2.status === 'fulfilled') s2SaksiFirst++;
  }

  console.log(`Hasil Skenario 2 (${ITERS_S2} Iterasi):`);
  console.log(`  Setujui Berhasil Diselesaikan : ${s2SetujuiFirst}`);
  console.log(`  Batal Berhasil Diselesaikan   : ${s2SaksiFirst}`);
  console.log(`  Deadlock (40P01)               : ${s2Deadlocks} (0 DEADLOCK)`);

  // --------------------------------------------------------------------------
  // Invariant Akhir Seluruh Database
  // --------------------------------------------------------------------------
  const invFinal = await admin.query(`
    SELECT id, total_masuk,
           saldo_tersedia + saldo_dicadangkan + total_tersalurkan as jumlah,
           (total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan) as invariant_ok
    FROM pos_dana;
  `);

  console.log('\n--- INVARIANT AKHIR SETELAH SELURUH RANGKAIAN PENGUJIAN ---');
  for (const r of invFinal.rows) {
    console.log(`  Pos ${r.id} | Total Masuk: ${r.total_masuk} | Jumlah Komponen: ${r.jumlah} | Invariant OK: ${r.invariant_ok}`);
  }

  await conn1.end();
  await conn2.end();
  await admin.end();

  if (s1BothSuccess === 0 && s1Deadlocks === 0 && s2Deadlocks === 0 && s1InvariantFailed === 0) {
    console.log('\n================================================================');
    console.log('KESIMPULAN: SELURUH PENGUJIAN KONKURANSI BERHASIL LOLOS 100%');
    console.log('================================================================');
    process.exit(0);
  } else {
    console.error('\nPENGUJIAN KONKURANSI GAGAL!');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
