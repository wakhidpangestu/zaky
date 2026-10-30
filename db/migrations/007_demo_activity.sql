-- ============================================================
-- Zaky — Aktivitas demo 30 hari untuk Lembaga Zakat A
--
-- Semua transaksi dibuat lewat stored procedure resmi (catat_penerimaan,
-- buat_draf_penyaluran, konfirmasi_saksi, setujui_penyaluran), berurutan
-- menurut waktu, sehingga saldo, invariant, dan antrean kerja sinkron.
--
-- Nominal kecil (ratusan ribu); total penerimaan Rp 7.100.000 (< Rp 10 juta).
-- Penyaluran mencakup kedelapan asnaf agar seluruh grafik dasbor terisi.
--
-- Stored procedure mencatat waktu "sekarang". Setelah semua transaksi dibuat,
-- waktu tiap peristiwa dipindah ke tanggal historisnya dan rantai hash audit
-- dihitung ulang dengan rumus yang identik dengan append_audit_log(),
-- sehingga verifikasi rantai tetap lolos. Hanya berjalan sekali saat
-- inisialisasi volume database demo.
-- ============================================================

CREATE TEMP TABLE seed_clock (nomor_dari bigint, nomor_sampai bigint, waktu timestamptz);

-- Catat rentang nomor audit yang dihasilkan sejak penanda terakhir, beserta waktu historisnya.
CREATE FUNCTION pg_temp.stamp(p_waktu timestamptz) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_dari bigint; v_sampai bigint;
BEGIN
  SELECT coalesce(max(nomor_sampai), 0) + 1 INTO v_dari FROM seed_clock;
  SELECT coalesce(max(nomor), 0) INTO v_sampai FROM audit_log;
  IF v_sampai >= v_dari THEN
    INSERT INTO seed_clock VALUES (v_dari, v_sampai, p_waktu);
  END IF;
END $$;

DO $$
DECLARE
  L       uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  u_pel   uuid := 'a1111111-1111-1111-1111-111111111111';
  budi    uuid := '11111111-1111-1111-1111-111111111111';
  hari    uuid := '22222222-2222-2222-2222-222222222222';
  dewi    uuid := '33333333-3333-3333-3333-333333333333';
  rian    uuid := '44444444-4444-4444-4444-444444444444';
  maal    uuid := 'c1111111-1111-1111-1111-111111111111';
  fitrah  uuid := 'c2222222-2222-2222-2222-222222222222';
  infak   uuid := 'c3333333-3333-3333-3333-333333333333';
  t0      timestamptz := date_trunc('hour', now());
  ev      record;
  v_id    uuid;
  v_at    timestamptz;
BEGIN
  -- Linimasa: tipe, hari lalu, jam, pos, nominal, hak amil, pencatat / mustahik, asnaf, tahap akhir.
  -- Tahap akhir penyaluran: 'terbit' (tersalurkan), 'disetujui_tunggu' (2 saksi, menunggu
  -- persetujuan), 'saksi1' (baru 1 saksi), 'draf' (baru dibuat).
  FOR ev IN
    SELECT * FROM (VALUES
      ('terima', 29, 9,  'maal',   600000, 75000, 'budi',   NULL, NULL, NULL),
      ('terima', 27, 10, 'fitrah', 350000, 43750, 'budi',   NULL, NULL, NULL),
      ('terima', 25, 13, 'infak',  250000, 25000, 'budi',   NULL, NULL, NULL),
      ('salur',  24, 14, 'maal',   300000, 0,     'budi',   'd1111111-1111-1111-1111-111111111111', 'fakir', 'terbit'),
      ('terima', 23, 9,  'maal',   750000, 93750, 'budi',   NULL, NULL, NULL),
      ('terima', 21, 15, 'fitrah', 300000, 37500, 'budi',   NULL, NULL, NULL),
      ('salur',  20, 10, 'fitrah', 250000, 0,     'budi',   'd2222222-2222-2222-2222-222222222222', 'miskin', 'terbit'),
      ('terima', 19, 11, 'infak',  200000, 20000, 'budi',   NULL, NULL, NULL),
      ('terima', 17, 10, 'maal',   500000, 62500, 'budi',   NULL, NULL, NULL),
      ('salur',  16, 13, 'maal',   400000, 0,     'budi',   'd3333333-3333-3333-3333-333333333333', 'gharimin', 'terbit'),
      ('terima', 15, 14, 'maal',   450000, 56250, 'budi',   NULL, NULL, NULL),
      ('salur',  14, 10, 'infak',  200000, 0,     'budi',   'd6666666-6666-6666-6666-666666666666', 'fisabilillah', 'terbit'),
      ('terima', 13, 9,  'fitrah', 400000, 50000, 'budi',   NULL, NULL, NULL),
      ('terima', 11, 16, 'infak',  300000, 30000, 'budi',   NULL, NULL, NULL),
      ('salur',  10, 11, 'maal',   150000, 0,     'budi',   'd4444444-4444-4444-4444-444444444444', 'muallaf', 'terbit'),
      ('terima', 9,  10, 'maal',   650000, 81250, 'budi',   NULL, NULL, NULL),
      ('salur',  8,  13, 'infak',  175000, 0,     'budi',   'd7777777-7777-7777-7777-777777777777', 'ibnu_sabil', 'terbit'),
      ('terima', 7,  13, 'fitrah', 250000, 31250, 'budi',   NULL, NULL, NULL),
      ('terima', 6,  9,  'maal',   550000, 68750, 'budi',   NULL, NULL, NULL),
      ('salur',  5,  10, 'maal',   200000, 0,     'budi',   'd5555555-5555-5555-5555-555555555555', 'riqab', 'terbit'),
      ('terima', 4,  11, 'infak',  350000, 35000, 'budi',   NULL, NULL, NULL),
      ('salur',  3,  14, 'fitrah', 225000, 0,     'budi',   'd2222222-2222-2222-2222-222222222222', 'miskin', 'terbit'),
      ('terima', 2,  10, 'maal',   400000, 50000, 'budi',   NULL, NULL, NULL),
      ('salur',  2,  15, 'maal',   100000, 0,     'budi',   'd8888888-8888-8888-8888-888888888888', 'amil', 'terbit'),
      ('terima', 1,  15, 'fitrah', 300000, 37500, 'budi',   NULL, NULL, NULL),
      ('salur',  1,  16, 'maal',   250000, 0,     'budi',   'd1111111-1111-1111-1111-111111111111', 'fakir', 'disetujui_tunggu'),
      ('terima', 0,  -4, 'maal',   500000, 62500, 'budi',   NULL, NULL, NULL),
      ('salur',  0,  -3, 'fitrah', 150000, 0,     'budi',   'd2222222-2222-2222-2222-222222222222', 'miskin', 'saksi1'),
      ('salur',  0,  -2, 'maal',   200000, 0,     'budi',   'd3333333-3333-3333-3333-333333333333', 'gharimin', 'draf')
    ) AS t(jenis, hari_lalu, jam, pos, nominal, hak_amil, oleh, mustahik, asnaf, akhir)
  LOOP
    -- Jam dibaca sebagai jam kerja WIB; jam negatif = "beberapa jam yang lalu" hari ini.
    v_at := CASE WHEN ev.jam < 0 THEN t0 + make_interval(hours => ev.jam)
                 ELSE (date_trunc('day', t0 AT TIME ZONE 'Asia/Jakarta')
                       - make_interval(days => ev.hari_lalu)
                       + make_interval(hours => ev.jam)) AT TIME ZONE 'Asia/Jakarta' END;

    IF ev.jenis = 'terima' THEN
      PERFORM catat_penerimaan(
        L,
        CASE ev.pos WHEN 'maal' THEN maal WHEN 'fitrah' THEN fitrah ELSE infak END,
        ev.nominal, ev.hak_amil,
        (ARRAY['tunai','transfer','qris'])[1 + (ev.hari_lalu % 3)],
        budi,
        'Data demo');
      PERFORM pg_temp.stamp(v_at);
    ELSE
      v_id := buat_draf_penyaluran(
        L,
        CASE ev.pos WHEN 'maal' THEN maal WHEN 'fitrah' THEN fitrah ELSE infak END,
        ev.mustahik::uuid, ev.asnaf::asnaf_enum, ev.nominal, 'saksi',
        budi, u_pel,
        'demo/bukti-' || ev.hari_lalu || '-' || ev.asnaf || '.jpg',
        digest('bukti demo ' || ev.hari_lalu || ev.asnaf, 'sha256'));
      PERFORM pg_temp.stamp(v_at);

      IF ev.akhir IN ('terbit', 'disetujui_tunggu', 'saksi1') THEN
        -- Saksi dari unit berbeda dengan pembuat dan dengan satu sama lain
        PERFORM konfirmasi_saksi(v_id, dewi, true);
        PERFORM pg_temp.stamp(v_at + interval '2 hours');
      END IF;
      IF ev.akhir IN ('terbit', 'disetujui_tunggu') THEN
        PERFORM konfirmasi_saksi(v_id, rian, true);
        PERFORM pg_temp.stamp(v_at + interval '3 hours');
      END IF;
      IF ev.akhir = 'terbit' THEN
        PERFORM setujui_penyaluran(v_id, hari);
        PERFORM pg_temp.stamp(v_at + interval '5 hours');
      END IF;
    END IF;
  END LOOP;
END $$;

-- ---- Pindahkan waktu ke tanggal historis ----------------------------------
ALTER TABLE audit_log DISABLE TRIGGER trg_audit_log_append_only;
ALTER TABLE work_events DISABLE TRIGGER work_events_append_only;
ALTER TABLE work_handoffs DISABLE TRIGGER work_handoffs_append_only;

-- Setiap baris audit mendapat waktu peristiwanya, berjarak 1 detik agar urutan tetap.
UPDATE audit_log a
SET waktu = c.waktu + make_interval(secs => a.nomor - c.nomor_dari)
FROM seed_clock c
WHERE a.nomor BETWEEN c.nomor_dari AND c.nomor_sampai;

-- Hitung ulang rantai hash dengan rumus yang identik dengan append_audit_log().
DO $$
DECLARE
  r      audit_log;
  v_prev bytea := decode(repeat('00', 32), 'hex');
  v_hash bytea;
BEGIN
  FOR r IN SELECT * FROM audit_log WHERE lembaga_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' ORDER BY nomor LOOP
    v_hash := digest(convert_to(json_build_object(
        'aksi', r.aksi,
        'entitas', r.entitas,
        'entitas_id', r.entitas_id,
        'lembaga_id', r.lembaga_id,
        'nomor', r.nomor,
        'pelaku', r.pelaku,
        'sebelum', r.sebelum,
        'sesudah', r.sesudah,
        'waktu', to_char(r.waktu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
      )::text, 'UTF8') || v_prev, 'sha256');
    UPDATE audit_log SET hash_sebelumnya = v_prev, hash_saat_ini = v_hash WHERE nomor = r.nomor;
    v_prev := v_hash;
  END LOOP;
  UPDATE rantai_kepala SET hash_kepala = v_prev
  WHERE lembaga_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
END $$;

-- Waktu transaksi mengikuti peristiwa audit pertama/terakhirnya.
UPDATE penerimaan p
SET dicatat_pada = (SELECT min(a.waktu) FROM audit_log a WHERE a.entitas_id = p.id);

UPDATE penyaluran d
SET dibuat_pada = s.awal,
    kedaluwarsa_pada = s.awal + interval '72 hours',
    penyetuju_waktu = CASE WHEN d.penyetuju_waktu IS NOT NULL THEN s.akhir END
FROM (SELECT entitas_id, min(waktu) AS awal, max(waktu) AS akhir FROM audit_log GROUP BY entitas_id) s
WHERE s.entitas_id = d.id;

UPDATE konfirmasi k
SET dipakai_pada = CASE WHEN k.dipakai_pada IS NOT NULL THEN d.dibuat_pada + interval '2 hours' END,
    kedaluwarsa_pada = d.kedaluwarsa_pada
FROM penyaluran d
WHERE d.id = k.penyaluran_id;

-- Antrean kerja mengikuti waktu sumbernya.
UPDATE work_items w
SET created_at = s.awal,
    updated_at = s.akhir,
    completed_at = CASE WHEN w.completed_at IS NOT NULL THEN s.akhir END
FROM (SELECT entitas_id, min(waktu) AS awal, max(waktu) AS akhir FROM audit_log GROUP BY entitas_id) s
WHERE s.entitas_id = w.reference_id;

UPDATE work_events e SET created_at = w.updated_at FROM work_items w WHERE w.id = e.work_item_id;
UPDATE work_handoffs h SET created_at = w.updated_at FROM work_items w WHERE w.id = h.work_item_id;

ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_append_only;
ALTER TABLE work_events ENABLE TRIGGER work_events_append_only;
ALTER TABLE work_handoffs ENABLE TRIGGER work_handoffs_append_only;
