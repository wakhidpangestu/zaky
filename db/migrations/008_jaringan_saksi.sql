-- ============================================================
-- Zaky — Jaringan saksi silang: Lembaga B dan C
--
-- Satu basis data menyimpan buku besar SATU lembaga (nomor audit_log global).
-- Lembaga B (Bandung) dan C (Surabaya) memegang buku besarnya di server sendiri;
-- di sini mereka tercatat sebagai anggota jaringan beserta kunci publik Ed25519,
-- agar kesaksian yang mereka tandatangani bisa diverifikasi.
--
-- Kunci publik di bawah adalah kunci DEMO, diturunkan dari seed terbuka
-- (lihat src/lib/jaringan/kunci.ts). Produksi wajib memakai kunci sendiri
-- lewat ZAKY_ED25519_SEED_A/B/C dan memperbarui direktori/anggota.json.
-- ============================================================

UPDATE lembaga
SET kunci_publik_ed25519 = decode('dabda8d21e90c87ba12a818d63c8228fbc6bd1d197db6de91ec7cb1427e421ee', 'hex')
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO lembaga (id, nama, kunci_publik_ed25519, persen_hak_amil_maks) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lembaga Amil Zakat Peduli B',
   decode('c75d1a17d996494d306773de18c0dcb40288b94b96ea78597567c18b75bf6238', 'hex'), 12.50),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lembaga Amil Zakat Amanah C',
   decode('283c0c292bf1c1f90cff72b18fea84f2db0fc890f7eb3fd2e7e511dc815e6f4e', 'hex'), 12.50)
ON CONFLICT (id) DO NOTHING;

-- Hitung ulang rantai hash dari entri pertama sampai p_sampai dengan rumus yang
-- identik dengan append_audit_log(). Saksi memakainya secara mandiri, tanpa
-- mempercayai kolom hash_saat_ini yang tersimpan.
--
-- p_ubah_nomor mensimulasikan perubahan paksa satu baris (hanya di memori,
-- tidak menyentuh tabel), untuk memperlihatkan bahwa hasilnya langsung berbeda.
-- rusak_di = nomor pertama yang hasil hitung ulangnya berbeda dari yang tersimpan.
CREATE OR REPLACE FUNCTION hitung_ulang_rantai(
  p_lembaga uuid,
  p_sampai bigint,
  p_ubah_nomor bigint DEFAULT NULL
) RETURNS TABLE (hash bytea, jumlah bigint, rusak_di bigint)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  r       audit_log;
  v_prev  bytea := decode(repeat('00', 32), 'hex');
  v_hash  bytea;
  v_n     bigint := 0;
  v_rusak bigint;
  v_isi   jsonb;
BEGIN
  FOR r IN
    SELECT * FROM audit_log
    WHERE lembaga_id = p_lembaga AND nomor <= p_sampai
    ORDER BY nomor
  LOOP
    v_isi := r.sesudah;
    IF r.nomor = p_ubah_nomor THEN
      v_isi := coalesce(r.sesudah, '{}'::jsonb) || '{"nominal_diubah_langsung": true}'::jsonb;
    END IF;
    v_hash := digest(convert_to(json_build_object(
        'aksi', r.aksi,
        'entitas', r.entitas,
        'entitas_id', r.entitas_id,
        'lembaga_id', r.lembaga_id,
        'nomor', r.nomor,
        'pelaku', r.pelaku,
        'sebelum', r.sebelum,
        'sesudah', v_isi,
        'waktu', to_char(r.waktu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
      )::text, 'UTF8') || v_prev, 'sha256');
    IF v_rusak IS NULL AND (v_hash <> r.hash_saat_ini OR v_prev <> r.hash_sebelumnya) THEN
      v_rusak := r.nomor;
    END IF;
    v_prev := v_hash;
    v_n := v_n + 1;
  END LOOP;
  RETURN QUERY SELECT v_prev, v_n, v_rusak;
END $$;
