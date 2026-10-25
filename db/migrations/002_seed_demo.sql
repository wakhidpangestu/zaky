-- ============================================================
-- Zaky v4.0 — Data Demo untuk Lembaga A
-- ============================================================

-- ID tetap agar bisa direferensikan antardata
DO $$
DECLARE
  v_lembaga_id  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_unit_1      uuid := 'a1111111-1111-1111-1111-111111111111'; -- Unit Pelayanan
  v_unit_2      uuid := 'a2222222-2222-2222-2222-222222222222'; -- Unit Keuangan
  v_unit_3      uuid := 'a3333333-3333-3333-3333-333333333333'; -- Unit Penyaluran
  v_unit_4      uuid := 'a4444444-4444-4444-4444-444444444444'; -- Unit Pengawasan
  v_akun_budi   uuid := '11111111-1111-1111-1111-111111111111'; -- Amil Budi
  v_akun_hari   uuid := '22222222-2222-2222-2222-222222222222'; -- Penyetuju Hari
  v_akun_dewi   uuid := '33333333-3333-3333-3333-333333333333'; -- Saksi Dewi
  v_akun_rian   uuid := '44444444-4444-4444-4444-444444444444'; -- Saksi Rian
  v_pos_maal    uuid := 'c1111111-1111-1111-1111-111111111111'; -- Zakat Maal
  v_pos_fitrah  uuid := 'c2222222-2222-2222-2222-222222222222'; -- Zakat Fitrah
  v_mustahik_1  uuid := 'd1111111-1111-1111-1111-111111111111';
  v_mustahik_2  uuid := 'd2222222-2222-2222-2222-222222222222';
  -- Password hash untuk "demo123" — menggunakan PBKDF2 placeholder
  v_pwd_hash    text := 'demo';
BEGIN

  -- ---- Lembaga ----
  INSERT INTO lembaga (id, nama, kunci_publik_ed25519, persen_hak_amil_maks)
  VALUES (v_lembaga_id, 'Lembaga Zakat A', decode(repeat('00', 32), 'hex'), 12.50);

  -- ---- Unit ----
  INSERT INTO unit (id, lembaga_id, nama) VALUES
    (v_unit_1, v_lembaga_id, 'Unit Pelayanan'),
    (v_unit_2, v_lembaga_id, 'Unit Keuangan'),
    (v_unit_3, v_lembaga_id, 'Unit Penyaluran'),
    (v_unit_4, v_lembaga_id, 'Unit Pengawasan');

  -- ---- Akun ----
  INSERT INTO akun (id, lembaga_id, unit_id, peran, nama, email, password_hash) VALUES
    (v_akun_budi, v_lembaga_id, v_unit_1, 'amil',      'Amil Budi',       'budi@lembaga-a.test', v_pwd_hash),
    (v_akun_hari, v_lembaga_id, v_unit_2, 'penyetuju', 'Penyetuju Hari',  'hari@lembaga-a.test', v_pwd_hash),
    (v_akun_dewi, v_lembaga_id, v_unit_3, 'amil',      'Saksi Dewi',      'dewi@lembaga-a.test', v_pwd_hash),
    (v_akun_rian, v_lembaga_id, v_unit_4, 'amil',      'Saksi Rian',      'rian@lembaga-a.test', v_pwd_hash);

  -- ---- Pos Dana ----
  -- Invariant: total_masuk = tersedia + dicadangkan + tersalurkan
  INSERT INTO pos_dana (id, lembaga_id, nama, total_masuk, saldo_tersedia, saldo_dicadangkan, total_tersalurkan) VALUES
    (v_pos_maal,   v_lembaga_id, 'Zakat Maal',        6000000, 1800000, 0, 4200000),
    (v_pos_fitrah, v_lembaga_id, 'Zakat Fitrah Uang', 1400000,  400000, 0, 1000000);

  -- ---- Mustahik ----
  INSERT INTO mustahik (id, lembaga_id, nama_samaran, kabupaten, asnaf, telepon_hmac, consent_at) VALUES
    (v_mustahik_1, v_lembaga_id, 'S***', 'Kabupaten Sleman', 'fakir',
     decode(repeat('aa', 32), 'hex'), now()),
    (v_mustahik_2, v_lembaga_id, 'A***', 'Kabupaten Bantul', 'miskin',
     decode(repeat('bb', 32), 'hex'), now());

  -- ---- Rantai Kepala ----
  INSERT INTO rantai_kepala (lembaga_id, nomor, hash_kepala)
  VALUES (v_lembaga_id, 0, decode(repeat('00', 32), 'hex'));

END $$;
