-- ============================================================
-- Zaky — Data induk demo Lembaga Zakat A
-- Hanya data induk: lembaga, unit, akun, pos dana (saldo nol), mustahik.
-- Semua transaksi dibuat di 007_demo_activity.sql lewat stored procedure resmi,
-- sehingga saldo, grafik, dan rantai audit selalu sinkron.
-- ============================================================

DO $$
DECLARE
  v_lembaga_id  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_unit_1      uuid := 'a1111111-1111-1111-1111-111111111111'; -- Unit Pelayanan
  v_unit_2      uuid := 'a2222222-2222-2222-2222-222222222222'; -- Unit Keuangan
  v_unit_3      uuid := 'a3333333-3333-3333-3333-333333333333'; -- Unit Penyaluran
  v_unit_4      uuid := 'a4444444-4444-4444-4444-444444444444'; -- Unit Pengawasan

  -- Empat akun, satu per unit: pembuat, dua saksi dari unit berbeda, dan penyetuju.
  v_akun_budi    uuid := '11111111-1111-1111-1111-111111111111'; -- Amil Budi
  v_akun_hari    uuid := '22222222-2222-2222-2222-222222222222'; -- Penyetuju Hari
  v_akun_dewi    uuid := '33333333-3333-3333-3333-333333333333'; -- Saksi Dewi
  v_akun_rian    uuid := '44444444-4444-4444-4444-444444444444'; -- Saksi Rian

  v_pos_maal     uuid := 'c1111111-1111-1111-1111-111111111111'; -- Zakat Maal
  v_pos_fitrah   uuid := 'c2222222-2222-2222-2222-222222222222'; -- Zakat Fitrah
  v_pos_infak    uuid := 'c3333333-3333-3333-3333-333333333333'; -- Infak & Sedekah Terikat

  -- Password demo "demo123" (penanda; login demo memeriksa di aplikasi)
  v_pwd_hash    text := 'demo';
BEGIN
  INSERT INTO lembaga (id, nama, kunci_publik_ed25519, persen_hak_amil_maks)
  VALUES (v_lembaga_id, 'Lembaga Zakat A', decode(repeat('00', 32), 'hex'), 12.50);

  INSERT INTO unit (id, lembaga_id, nama) VALUES
    (v_unit_1, v_lembaga_id, 'Unit Pelayanan'),
    (v_unit_2, v_lembaga_id, 'Unit Keuangan'),
    (v_unit_3, v_lembaga_id, 'Unit Penyaluran'),
    (v_unit_4, v_lembaga_id, 'Unit Pengawasan');

  INSERT INTO akun (id, lembaga_id, unit_id, peran, nama, email, password_hash) VALUES
    (v_akun_budi,   v_lembaga_id, v_unit_1, 'amil',      'Amil Budi',       'budi@lembaga-a.test',   v_pwd_hash),
    (v_akun_hari,   v_lembaga_id, v_unit_2, 'penyetuju', 'Penyetuju Hari',  'hari@lembaga-a.test',   v_pwd_hash),
    (v_akun_dewi,   v_lembaga_id, v_unit_3, 'amil',      'Saksi Dewi',      'dewi@lembaga-a.test',   v_pwd_hash),
    (v_akun_rian,   v_lembaga_id, v_unit_4, 'amil',      'Saksi Rian',      'rian@lembaga-a.test',   v_pwd_hash);

  -- Pos dana mulai dari nol; saldo terbentuk dari transaksi di 007.
  -- Invariant: total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan
  INSERT INTO pos_dana (id, lembaga_id, nama, total_masuk, saldo_tersedia, saldo_dicadangkan, total_tersalurkan) VALUES
    (v_pos_maal,   v_lembaga_id, 'Zakat Maal',              0, 0, 0, 0),
    (v_pos_fitrah, v_lembaga_id, 'Zakat Fitrah Uang',       0, 0, 0, 0),
    (v_pos_infak,  v_lembaga_id, 'Infak & Sedekah Terikat', 0, 0, 0, 0);

  -- Satu mustahik per asnaf (nama samaran; telepon hanya HMAC) agar grafik asnaf lengkap.
  INSERT INTO mustahik (id, lembaga_id, nama_samaran, kabupaten, asnaf, telepon_hmac, consent_at) VALUES
    ('d1111111-1111-1111-1111-111111111111', v_lembaga_id, 'S***', 'Kabupaten Sleman',      'fakir',        decode(repeat('a1', 32), 'hex'), now()),
    ('d2222222-2222-2222-2222-222222222222', v_lembaga_id, 'A***', 'Kabupaten Bantul',      'miskin',       decode(repeat('a2', 32), 'hex'), now()),
    ('d3333333-3333-3333-3333-333333333333', v_lembaga_id, 'M***', 'Kota Yogyakarta',       'gharimin',     decode(repeat('a3', 32), 'hex'), now()),
    ('d4444444-4444-4444-4444-444444444444', v_lembaga_id, 'H***', 'Kabupaten Gunungkidul', 'muallaf',      decode(repeat('a4', 32), 'hex'), now()),
    ('d5555555-5555-5555-5555-555555555555', v_lembaga_id, 'R***', 'Kabupaten Kulon Progo', 'riqab',        decode(repeat('a5', 32), 'hex'), now()),
    ('d6666666-6666-6666-6666-666666666666', v_lembaga_id, 'F***', 'Kota Yogyakarta',       'fisabilillah', decode(repeat('a6', 32), 'hex'), now()),
    ('d7777777-7777-7777-7777-777777777777', v_lembaga_id, 'I***', 'Kabupaten Sleman',      'ibnu_sabil',   decode(repeat('a7', 32), 'hex'), now()),
    ('d8888888-8888-8888-8888-888888888888', v_lembaga_id, 'N***', 'Kabupaten Bantul',      'amil',         decode(repeat('a8', 32), 'hex'), now());

  INSERT INTO rantai_kepala (lembaga_id, nomor, hash_kepala)
  VALUES (v_lembaga_id, 0, decode(repeat('00', 32), 'hex'));
END $$;
