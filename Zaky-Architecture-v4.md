# Arsitektur Teknis Zaky v4.0

**Dokumen terkait:** Zaky-Proposal-v4.md, Zaky-PRD-v4.md
**Menggantikan:** Zaky-Architecture-v3.md
**Status:** Draf untuk eksekusi

---

## 1. Prinsip Arsitektur

1. **Integritas dijaga di basis data.** Constraint, trigger, dan transaksi terkunci berlaku meskipun aplikasi salah atau dilewati.
2. **Logika kritis berjalan di server basis data.** Reservasi saldo, penulisan log, dan transisi status penyaluran berada dalam fungsi SQL. Ini memperpendek waktu penguncian dan menghilangkan jarak antara perubahan saldo dan penulisan log.
3. **Pembuktian berasal dari luar basis data.** Hash harian yang ditandatangani dan disaksikan lembaga lain adalah bukti, bukan isi basis data itu sendiri.
4. **Klaim sesuai kemampuan.** Setiap batasan dinyatakan. Sistem tidak mengklaim mencegah pemilik basis data, dan tidak mengklaim independensi yang belum terbukti.

---

## 2. Gambaran Besar

```
 Lembaga A                      Lembaga B                      Lembaga C
 (proyek Supabase A)            (proyek Supabase B)            (proyek Supabase C)
 ┌───────────────────────┐      ┌───────────────────────┐      ┌───────────────────────┐
 │ Next.js (Vercel A)    │      │ Next.js (Vercel B)    │      │ Next.js (Vercel C)    │
 │ PostgreSQL + fungsi   │      │ PostgreSQL + fungsi   │      │ PostgreSQL + fungsi   │
 │ Redis A               │      │ Redis B               │      │ Redis C               │
 │ Kunci Ed25519 A       │      │ Kunci Ed25519 B       │      │ Kunci Ed25519 C       │
 │ Cron hash harian      │      │ Cron hash harian      │      │ Cron hash harian      │
 └──────────┬────────────┘      └──────────┬────────────┘      └──────────┬────────────┘
            │  GET hash harian, POST kesaksian (ditandatangani)            │
            └──────────────────────────────┼───────────────────────────────┘
                                           │
                        Direktori anggota (berkas JSON, disepakati bersama)
                                           │
                    Papan silang publik: membaca hash terbit dan kesaksian,
                    lalu menghitung ulang hash dari log masing-masing lembaga
```

---

## 3. Komponen

| Komponen | Teknologi | Tanggung jawab |
| --- | --- | --- |
| Antarmuka | Next.js App Router, TypeScript, Tailwind | Dasbor amil, penyetuju, konfirmasi, verifikasi publik, papan silang |
| API internal | Route Handlers, sesi cookie, CSRF | Operasi tulis oleh pengguna |
| API jaringan | Route Handlers, tanda tangan Ed25519 | Pertukaran hash dan kesaksian antarinstance |
| API publik | Route Handlers, rate limit | Verifikasi, hash harian, data papan silang (hanya-baca) |
| Fungsi SQL | PL/pgSQL | Reservasi, transisi status, penulisan log dalam satu transaksi |
| Basis data | PostgreSQL (Supabase) | Data, constraint, trigger, kunci baris |
| Cache | Redis (Upstash) | Cache halaman publik dan rate limit |
| Penyimpanan bukti | Supabase Storage | Berkas bukti dengan hash SHA-256 |
| Penjadwal | Vercel Cron | Penerbitan hash harian dan pengambilan kesaksian |
| Kriptografi | Node.js `crypto` | HMAC-SHA256, Ed25519, SHA-256, JCS |

---

## 4. Struktur Repositori

```
zaky/
├── app/
│   ├── (amil)/
│   ├── (penyetuju)/
│   ├── konfirmasi/[token]/
│   ├── verifikasi/[kode]/
│   ├── silang/
│   └── api/
│       ├── internal/
│       ├── jaringan/
│       ├── publik/
│       └── cron/
├── src/
│   ├── domain/                    # Aturan murni: validasi asnaf, hak amil, mesin status
│   ├── application/               # Use case yang memanggil fungsi SQL
│   ├── infrastructure/
│   │   ├── db/                    # Pemanggilan fungsi SQL, pembacaan
│   │   ├── kripto/                # HMAC, Ed25519, JCS, SHA-256
│   │   ├── jaringan/              # Klien antarinstance, direktori, kesaksian
│   │   ├── log/                   # Verifikasi ulang rantai
│   │   ├── cache/
│   │   ├── storage/
│   │   └── notifikasi/
│   └── ui/
├── db/
│   ├── migrations/                # Tabel, constraint, trigger, fungsi SQL
│   └── tests/                     # Uji constraint, trigger, dan fungsi langsung di basis data
├── tests/
│   ├── konkurensi/                # Dua draf bersamaan
│   ├── kunci/                     # Uji urutan penguncian dan pengukuran waktu
│   ├── serangan/                  # Uji penolakan dan deteksi perubahan
│   ├── jaringan/                  # Tiga instance lokal
│   └── e2e/                       # Playwright
├── direktori/
│   └── anggota.json               # Daftar anggota dan kunci publik
└── scripts/
    ├── jalankan-tiga-instance.sh
    ├── konkurensi.ts
    └── serang-log.sh              # Demo serangan admin, dengan akses superuser
```

---

## 5. Urutan Penguncian

### 5.1 Aturan Global

```
pos_dana  →  penyaluran  →  rantai_kepala
```

Setiap transaksi mengunci tabel dalam urutan ini atau tidak mengunci tabel yang berada setelahnya. Tiga jalur yang ada di sistem:

| Jalur | Mengunci | Konsisten dengan urutan |
| --- | --- | --- |
| Reservasi draf | `pos_dana`, lalu `rantai_kepala` | Ya |
| Konfirmasi (mustahik atau saksi) | `penyaluran`, lalu `rantai_kepala` | Ya |
| Persetujuan dan tersalurkan | `pos_dana`, `penyaluran`, lalu `rantai_kepala` | Ya |
| Penerbitan hash harian | `rantai_kepala` saja (dengan `FOR SHARE` saat membaca) | Ya, tidak pernah mengunci `pos_dana` |
| Penerimaan | `pos_dana`, lalu `rantai_kepala` | Ya |

Karena tidak ada jalur yang mengunci `rantai_kepala` lalu meminta tabel lain, siklus tunggu tidak mungkin terbentuk.

### 5.2 Batas Waktu

- Penguncian `rantai_kepala`, dari `SELECT ... FOR UPDATE` sampai `COMMIT`, ditargetkan kurang dari 2 ms.
- Target ini hanya berlaku jika seluruh transaksi berjalan di dalam fungsi SQL. Jika setiap langkah dikirim sebagai query terpisah dari aplikasi, waktu jaringan antara Vercel dan Supabase membuat target tidak tercapai.
- Pengukuran dilakukan dengan `clock_timestamp()` di dalam fungsi dan dicatat ke tabel metrik lokal. Hasilnya dilaporkan dengan jumlah sampel dan persentil.

### 5.3 Pengujian Urutan

- Skrip paralel menjalankan reservasi, konfirmasi, dan penerbitan hash secara bersamaan selama beberapa ribu iterasi.
- Pengujian gagal jika ada deadlock yang dilaporkan PostgreSQL.
- Pengujian juga menjalankan jalur yang sengaja mencoba mengunci `rantai_kepala` lebih dulu, dan memastikan jalur itu tidak ada di kode produksi.

---

## 6. Skema Basis Data

### 6.1 Pos Dana

```sql
CREATE TABLE pos_dana (
  id                  uuid PRIMARY KEY,
  nama                text NOT NULL,
  total_masuk         numeric(18,2) NOT NULL DEFAULT 0,
  saldo_tersedia      numeric(18,2) NOT NULL DEFAULT 0,
  saldo_dicadangkan   numeric(18,2) NOT NULL DEFAULT 0,
  total_tersalurkan   numeric(18,2) NOT NULL DEFAULT 0,
  CHECK (saldo_tersedia    >= 0),
  CHECK (saldo_dicadangkan >= 0),
  CHECK (total_tersalurkan >= 0),
  CHECK (total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan)
);
```

### 6.2 Penerimaan dan Hak Amil

```sql
CREATE TABLE penerimaan (
  id           uuid PRIMARY KEY,
  kode_unik    char(12) UNIQUE NOT NULL,
  pos_id       uuid NOT NULL REFERENCES pos_dana(id),
  bruto        numeric(18,2) NOT NULL CHECK (bruto > 0),
  hak_amil     numeric(18,2) NOT NULL CHECK (hak_amil >= 0),
  masuk_pos    numeric(18,2) NOT NULL CHECK (masuk_pos >= 0),
  kanal        text NOT NULL,
  dicatat_oleh uuid NOT NULL,
  dicatat_pada timestamptz NOT NULL DEFAULT now(),
  CHECK (bruto = hak_amil + masuk_pos)
);
```

### 6.3 Unit, Akun, Mustahik

```sql
CREATE TABLE unit (
  id    uuid PRIMARY KEY,
  nama  text NOT NULL
);

CREATE TABLE akun (
  id            uuid PRIMARY KEY,
  unit_id       uuid NOT NULL REFERENCES unit(id),
  peran         text NOT NULL CHECK (peran IN ('amil','penyetuju','admin')),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL
);

CREATE TYPE asnaf_enum AS ENUM
  ('fakir','miskin','amil','muallaf','riqab','gharimin','fisabilillah','ibnu_sabil');

CREATE TABLE mustahik (
  id            uuid PRIMARY KEY,
  nama_samaran  text NOT NULL,
  kabupaten     text NOT NULL,
  asnaf         asnaf_enum NOT NULL,
  telepon_hmac  bytea NOT NULL,
  consent_at    timestamptz NOT NULL
);
```

Catatan: `nik_jaringan` tidak ada di v4 karena pemeriksaan duplikasi masuk roadmap. NIK asli tidak disimpan.

### 6.4 Penyaluran

```sql
CREATE TYPE status_penyaluran AS ENUM
  ('dibuat','menunggu_konfirmasi','ditolak_penerima','dikonfirmasi',
   'disetujui','tersalurkan','kedaluwarsa','dibatalkan');

CREATE TABLE penyaluran (
  id               uuid PRIMARY KEY,
  kode_unik        char(12) UNIQUE NOT NULL,
  pos_id           uuid NOT NULL REFERENCES pos_dana(id),
  mustahik_id      uuid NOT NULL REFERENCES mustahik(id),
  asnaf            asnaf_enum NOT NULL,
  nominal          numeric(18,2) NOT NULL CHECK (nominal > 0),
  status           status_penyaluran NOT NULL,
  metode           text NOT NULL CHECK (metode IN ('mustahik','saksi')),
  dibuat_oleh      uuid NOT NULL REFERENCES akun(id),
  dibuat_unit      uuid NOT NULL REFERENCES unit(id),
  penyetuju_akun   uuid REFERENCES akun(id),
  penyetuju_unit   uuid REFERENCES unit(id),
  kedaluwarsa_pada timestamptz NOT NULL,
  CHECK (penyetuju_akun IS NULL OR penyetuju_akun <> dibuat_oleh),
  CHECK (penyetuju_unit IS NULL OR penyetuju_unit <> dibuat_unit),
  CHECK (status <> 'tersalurkan' OR (penyetuju_akun IS NOT NULL AND penyetuju_unit IS NOT NULL))
);
```

### 6.5 Konfirmasi (Dua Metode)

```sql
CREATE TABLE konfirmasi (
  id                uuid PRIMARY KEY,
  penyaluran_id     uuid NOT NULL REFERENCES penyaluran(id),
  jenis             text NOT NULL CHECK (jenis IN ('mustahik','saksi')),
  akun_saksi_id     uuid REFERENCES akun(id),
  unit_saksi        uuid REFERENCES unit(id),
  token_hash        bytea,
  dipakai_pada      timestamptz,
  kedaluwarsa_pada  timestamptz NOT NULL,
  hasil             text CHECK (hasil IN ('menerima','menolak')),
  CHECK (
    (jenis = 'mustahik' AND akun_saksi_id IS NULL AND unit_saksi IS NULL AND token_hash IS NOT NULL)
    OR
    (jenis = 'saksi'    AND akun_saksi_id IS NOT NULL AND unit_saksi IS NOT NULL AND token_hash IS NULL)
  ),
  UNIQUE (penyaluran_id, akun_saksi_id)
);

-- Metode mustahik hanya boleh punya satu konfirmasi
CREATE UNIQUE INDEX konfirmasi_mustahik_tunggal
  ON konfirmasi (penyaluran_id) WHERE jenis = 'mustahik';
```

`UNIQUE (penyaluran_id, akun_saksi_id)` mencegah saksi yang sama dihitung dua kali. Indeks parsial menjamin hanya satu konfirmasi mustahik per penyaluran.

### 6.6 Log Append-Only dan Kepala Rantai

```sql
CREATE TABLE rantai_kepala (
  lembaga_id   uuid PRIMARY KEY,
  nomor        bigint NOT NULL DEFAULT 0,
  hash_kepala  bytea NOT NULL
);

CREATE TABLE audit_log (
  nomor           bigint PRIMARY KEY,
  lembaga_id      uuid NOT NULL,
  entitas         text NOT NULL,
  entitas_id      uuid NOT NULL,
  aksi            text NOT NULL,
  pelaku          uuid NOT NULL,
  sebelum         jsonb,
  sesudah         jsonb,
  waktu           timestamptz NOT NULL DEFAULT now(),
  hash_sebelumnya bytea NOT NULL,
  hash_saat_ini   bytea NOT NULL UNIQUE
);

CREATE OR REPLACE FUNCTION tolak_ubah_log() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log bersifat append-only' USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_tanpa_ubah
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION tolak_ubah_log();
```

### 6.7 Hash Harian dan Kesaksian

```sql
CREATE TABLE hash_harian (
  lembaga_id        uuid NOT NULL,
  tanggal           date NOT NULL,
  payload_jcs       bytea NOT NULL,
  hash_kepala       bytea NOT NULL,
  tanda_tangan      bytea NOT NULL,
  kunci_id          text NOT NULL,
  diterbitkan_pada  timestamptz NOT NULL,
  PRIMARY KEY (lembaga_id, tanggal)
);

CREATE TABLE kesaksian (
  saksi_lembaga_id   uuid NOT NULL,
  lembaga_id         uuid NOT NULL,
  tanggal            date NOT NULL,
  hash_disaksikan    bytea NOT NULL,
  tanda_tangan_saksi bytea NOT NULL,
  diamati_pada       timestamptz NOT NULL,
  PRIMARY KEY (saksi_lembaga_id, lembaga_id, tanggal),
  CHECK (saksi_lembaga_id <> lembaga_id)
);
```

`jumlah_entri` ada di dalam payload JCS, sehingga verifikator dapat menghitung ulang hanya sampai entri tersebut.

---

## 7. Fungsi SQL Inti

### 7.1 Buat Draf Penyaluran (Reservasi)

Fungsi ini mengunci `pos_dana`, lalu `rantai_kepala`, dan menulis perubahan dalam satu transaksi.

```sql
CREATE OR REPLACE FUNCTION buat_draf_penyaluran(
  p_pos_id uuid, p_mustahik_id uuid, p_nominal numeric,
  p_dibuat_oleh uuid, p_dibuat_unit uuid, p_kode char(12), p_kedaluwarsa timestamptz
) RETURNS uuid AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_asnaf_pos asnaf_enum;
  v_asnaf_mustahik asnaf_enum;
  v_lembaga uuid;
BEGIN
  -- 1. kunci pos
  PERFORM 1 FROM pos_dana WHERE id = p_pos_id FOR UPDATE;

  -- 2. cek saldo
  IF (SELECT saldo_tersedia FROM pos_dana WHERE id = p_pos_id) < p_nominal THEN
    RAISE EXCEPTION 'INSUFFICIENT_AVAILABLE_BALANCE' USING ERRCODE = 'P0002';
  END IF;

  -- 3. cek asnaf (sumber kebenaran ada di mustahik)
  SELECT asnaf INTO v_asnaf_mustahik FROM mustahik WHERE id = p_mustahik_id;

  -- 4. reservasi
  UPDATE pos_dana
     SET saldo_tersedia    = saldo_tersedia - p_nominal,
         saldo_dicadangkan = saldo_dicadangkan + p_nominal
   WHERE id = p_pos_id;

  -- 5. insert penyaluran
  INSERT INTO penyaluran (id, kode_unik, pos_id, mustahik_id, asnaf, nominal, status,
                          metode, dibuat_oleh, dibuat_unit, kedaluwarsa_pada)
  VALUES (v_id, p_kode, p_pos_id, p_mustahik_id, v_asnaf_mustahik, p_nominal, 'dibuat',
          'mustahik', p_dibuat_oleh, p_dibuat_unit, p_kedaluwarsa);

  -- 6. log (mengunci rantai_kepala, urutan terakhir)
  PERFORM tulis_log(p_pos_id, 'penyaluran', v_id, 'DIBUAT', p_dibuat_oleh);

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
```

Catatan implementasi: `metode` akan diisi ulang saat konfirmasi dimulai, dan parameter asnaf dari klien diabaikan. Asnaf diambil dari data mustahik agar tidak bisa dipalsukan.

### 7.2 Penulisan Log

```sql
CREATE OR REPLACE FUNCTION tulis_log(
  p_pos_id uuid, p_entitas text, p_entitas_id uuid, p_aksi text, p_pelaku uuid
) RETURNS void AS $$
DECLARE
  v_lembaga uuid;
  v_nomor bigint;
  v_prev bytea;
  v_hash bytea;
BEGIN
  SELECT lembaga_id INTO v_lembaga FROM pos_dana WHERE id = p_pos_id;

  -- kunci kepala rantai (urutan terakhir)
  SELECT nomor, hash_kepala INTO v_nomor, v_prev
    FROM rantai_kepala WHERE lembaga_id = v_lembaga FOR UPDATE;

  v_nomor := v_nomor + 1;
  v_hash := digest(
    jcs_entri(v_lembaga, p_entitas, p_entitas_id, p_aksi, p_pelaku, v_nomor)
    || v_prev, 'sha256');

  INSERT INTO audit_log (nomor, lembaga_id, entitas, entitas_id, aksi, pelaku,
                         hash_sebelumnya, hash_saat_ini)
  VALUES (v_nomor, v_lembaga, p_entitas, p_entitas_id, p_aksi, p_pelaku, v_prev, v_hash);

  UPDATE rantai_kepala SET nomor = v_nomor, hash_kepala = v_hash
   WHERE lembaga_id = v_lembaga;
END;
$$ LANGUAGE plpgsql;
```

`jcs_entri` / format payload terdefinisi: Sesuai keputusan P6 untuk kepraktisan dan integritas versi lomba, fungsi `append_audit_log` tetap menggunakan parameter terstruktur `(lembaga_id, entitas, entitas_id, aksi, pelaku, sebelum, sesudah)`. Serialisasi dibangun langsung di dalam SQL menggunakan `json_build_object` sebagai **format payload terdefinisi** (bukan RFC 8785 JCS murni) dengan urutan kunci terurut terdefinisi mencakup atribut `aksi`, `entitas`, `entitas_id`, `lembaga_id`, `nomor`, `pelaku`, `sebelum`, `sesudah`, dan `waktu` berformat UTC mikrodetik eksplisit (`YYYY-MM-DD"T"HH24:MI:SS.US"Z"`). Payload ini digabungkan secara biner dengan `v_prev_hash` (`digest(convert_to(v_payload, 'UTF8') || v_prev_hash, 'sha256')`). Verifikator independen mereproduksi payload dengan urutan kunci dan format waktu yang persis sama.

### 7.3 Konfirmasi Saksi

Setiap konfirmasi saksi memanggil fungsi yang mengunci `penyaluran`, lalu `rantai_kepala`. Persetujuan dan perpindahan status ke `dikonfirmasi` dihitung dalam fungsi yang sama.

Aturan yang diperiksa:
1. Saksi bukan pembuat dan bukan saksi pertama.
2. Unit saksi berbeda dengan unit pembuat.
3. Setelah konfirmasi kedua bernilai "menerima", status menjadi `dikonfirmasi`.
4. Penolakan oleh saksi mana pun mengubah status menjadi `ditolak_penerima` dan melepas reservasi.

Pemeriksaan keempat akun unik dilakukan saat persetujuan, karena penyetuju baru diketahui pada saat itu. Persetujuan memeriksa penyetuju berbeda dari pembuat, saksi 1, dan saksi 2, serta unitnya berbeda dari pembuat.

### 7.4 Persetujuan

```
BEGIN;
  kunci pos_dana (FOR UPDATE)
  kunci penyaluran (FOR UPDATE)
  periksa status = dikonfirmasi
  periksa penyetuju ∉ {pembuat, saksi1, saksi2}
  periksa unit penyetuju ≠ unit pembuat
  saldo_dicadangkan -= nominal
  total_tersalurkan += nominal
  status = tersalurkan
  tulis_log(...)              -- kunci rantai_kepala, urutan terakhir
COMMIT;
```

---

## 8. Hash Harian dan Hitung Ulang

### 8.1 Penerbitan

```
Cron 00.00 WIB:
  1. BEGIN
  2. SELECT ... FROM rantai_kepala WHERE lembaga_id = X FOR SHARE
     (tidak mengunci pos_dana)
  3. jumlah_entri = nomor saat ini
     hash_kepala = hash_kepala saat ini
  4. payload = JCS({versi:1, lembaga_id, tanggal, hash_kepala, jumlah_entri})
  5. tanda_tangan = Ed25519(payload, kunci_lembaga)
  6. INSERT hash_harian (...)   -- PK mencegah penerbitan ganda
  7. COMMIT
```

Jika hari sebelumnya belum diterbitkan, cron menerbitkan hash untuk tanggal tersebut dengan `jumlah_entri` sampai entri yang ada pada akhir tanggal itu. Untuk itu, setiap entri log menyimpan `waktu`, dan cron menghitung `jumlah_entri` dari waktu batas.

### 8.2 Pengambilan dan Kesaksian

Instance B untuk tanggal D:
1. Mengambil `GET /api/publik/hash-harian/{A}/{D}` dari instance A.
2. Memverifikasi tanda tangan dengan kunci A dari direktori.
3. Menyimpan salinan di tabel lokal.
4. Menandatangani kesaksian dan mengirim `POST /api/jaringan/kesaksian` ke A, C, dan instance lain.

### 8.3 Hitung Ulang oleh Papan Silang

Papan silang tidak hanya membaca hash yang tersimpan. Untuk setiap lembaga dan tanggal D:

```
1. Ambil payload_jcs dan jumlah_entri dari hash_harian (lembaga, D)
2. Hitung ulang hash kepala dari entri log 1..jumlah_entri pada basis data lembaga itu:
     h_0 = 0x00...00 (32 byte nol)
     h_n = SHA-256(JCS(entri_n) || h_(n-1))
3. Bandingkan h_jumlah_entri dengan hash_kepala di payload
4. Bandingkan hash_kepala di payload dengan hash_disaksikan dari B dan C
5. Status:
   - semua cocok dan kesaksian ≥ 2 → Terkonfirmasi
   - semua cocok dan kesaksian < 2 → Belum cukup saksi
   - salah satu tidak cocok        → Tidak cocok
   - belum terbit                  → Belum diterbitkan
```

**Mengapa hitung ulang penting:** tanpa hitung ulang, papan silang hanya membandingkan dua salinan hash. Jika pemilik basis data mengubah entri lalu menghitung ulang rantai ke depan, hash yang tersimpan tetap sama dan perubahan tidak terlihat. Hitung ulang dari entri `1..jumlah_entri` membuat perubahan pada entri mana pun di rentang itu mengubah `h_jumlah_entri`.

**Batasan:** perubahan pada entri setelah `jumlah_entri` tidak terdeteksi oleh hari tersebut, tetapi terdeteksi oleh hari berikutnya, karena hash harian berikutnya mencakup entri tersebut.

---

## 9. Kebijakan Restore

Kebijakan ini ditulis sebagai prosedur lembaga dan sebagai aturan pengujian.

**Aturan:**
1. Pemulihan cadangan tidak boleh kembali ke titik sebelum hash harian terakhir yang sudah diterbitkan.
2. Pemulihan yang melewati titik itu wajib disertai catatan insiden tertulis.
3. Sistem tidak dapat mencegah pemilik basis data melakukan pemulihan secara teknis.
4. Setiap perubahan hash setelah penerbitan diperlakukan sebagai Tidak cocok.

**Yang terjadi saat pemulihan melanggar aturan:**
- Basis data kembali ke keadaan lama. Nomor dan hash kepala di `rantai_kepala` juga kembali.
- Penyaluran baru yang dibuat setelah titik pemulihan hilang dari basis data.
- Saat hash harian untuk hari setelah pemulihan diterbitkan, kepala rantai baru tidak sama dengan kepala yang sudah disaksikan.
- Papan silang menghitung ulang dan menampilkan Tidak cocok untuk tanggal yang sudah disaksikan.

**Yang tidak bisa dideteksi:** pemulihan yang dilakukan sebelum hash harian pertama tanggal itu diterbitkan. Karena itu, kebijakan menetapkan titik batas, bukan larangan mutlak.

**Pengujian:** skrip `scripts/pulihkan-cadangan.sh` memulihkan basis data uji ke titik sebelum penerbitan terakhir. Papan silang harus menampilkan Tidak cocok.

---

## 10. Keamanan

### 10.1 Autentikasi dan Otorisasi

| Subjek | Autentikasi | Otorisasi |
| --- | --- | --- |
| Amil | Email dan kata sandi (Argon2id), sesi cookie | Membuat draf dan penerimaan lembaganya |
| Penyetuju | Sama | Menyetujui penyaluran dari unit lain dan bukan pelaku sebelumnya |
| Saksi | Akun Zaky sendiri | Mengonfirmasi penyaluran dari unit lain dan bukan pembuat |
| Admin lembaga | Sama, dengan MFA | Kelola akun, unit, kunci. Tidak bisa menyetujui |
| Mustahik | Tautan sekali pakai, token acak 32 byte (dibuat aplikasi, disimpan SHA-256) | Satu konfirmasi |
| Instance anggota | Tanda tangan Ed25519 atas setiap permintaan | Endpoint jaringan saja |
| Publik | Tidak ada | Endpoint hanya-baca dengan rate limit |

> [!NOTE] Siklus Hidup Token Konfirmasi Mustahik
> 1. Aplikasi membangkitkan token acak 32 byte kriptografis di sisi runtime (memori aplikasi).
> 2. Aplikasi menghitung hash SHA-256 dari token tersebut dan mengirimkannya sebagai parameter `p_token_hash` ke prosedur `buat_draf_penyaluran`.
> 3. Basis data hanya mencatat nilai hash SHA-256 ke tabel `konfirmasi` (`dipakai_pada IS NULL`). Token asli tidak pernah disimpan di basis data.
> 4. Aplikasi mengirimkan tautan berisi token mentah ke nomor ponsel mustahik (SMS/WhatsApp).
> 5. Saat mustahik mengonfirmasi, aplikasi meneruskan hash token ke `konfirmasi_mustahik` untuk diverifikasi terhadap hash tersimpan.

### 10.2 Kriptografi

| Penggunaan | Algoritma |
| --- | --- |
| Kata sandi | Argon2id |
| Token konfirmasi | Acak 32 byte, disimpan SHA-256 |
| Nomor ponsel | HMAC-SHA256 dengan kunci lembaga |
| Hash entri log | SHA-256 atas JCS |
| Hash harian dan kesaksian | Ed25519 |
| Permintaan jaringan | Ed25519, dengan nonce dan waktu |

Pepper dan kunci Ed25519 disimpan di environment, tidak di basis data.

### 10.3 Pencegahan Serangan Umum

| Ancaman | Mitigasi |
| --- | --- |
| SQL injection | Parameter binding pada fungsi dan query |
| XSS | Escape React, CSP ketat, tanpa HTML mentah dari pengguna |
| CSRF | SameSite cookie, token CSRF untuk endpoint tulis |
| Replay permintaan jaringan | Nonce dan waktu, ditolak jika lebih dari 5 menit |
| Pemalsuan kesaksian | Tanda tangan dicocokkan dengan direktori |
| Ubah log lewat aplikasi | Trigger, rantai, dan hitung ulang oleh papan silang |
| Ubah log lewat superuser | Dideteksi oleh hitung ulang dan kesaksian lembaga lain |
| Manipulasi nominal | Nominal dihitung di server dan di fungsi SQL |
| Unggah berkas berbahaya | Tipe terbatas, batas 5 MB, storage terpisah |

### 10.4 Yang Tidak Dilindungi

- Pemilik basis data dapat mematikan trigger dan mengubah log. Perubahan tetap terdeteksi selama hash sebelumnya sudah disaksikan.
- Pemilik basis data dapat mengubah entri setelah `jumlah_entri` pada hari terakhir sebelum penerbitan berikutnya. Perubahan ini terdeteksi pada hari berikutnya.
- Lembaga yang bersekongkol dengan saksinya tidak terdeteksi.
- Kunci Ed25519 yang dicuri dapat dipakai menerbitkan hash palsu sampai pencabutan diumumkan.
- Amil dan penerima yang bersekongkol tidak terdeteksi sistem.

---

## 11. Ketersediaan

| Mekanisme | Detail | Kebutuhan |
| --- | --- | --- |
| Cache halaman publik | Redis, TTL 5 menit | AV-01 |
| Salinan saat gangguan | Halaman menampilkan cache dengan waktu pengambilan | AV-01 |
| Status Menunggu | Permintaan yang gagal disimpan dan diulang | AV-02 |
| Coba ulang hash harian | Tiga kali, lalu pengejaran | AV-03 |
| Coba ulang kesaksian | Tiga kali per anggota | AV-04 |
| Batas waktu koneksi | 3 detik untuk pemanggilan antarinstance | AV-04 |
| Health check | `/api/health` memeriksa basis data dan Redis | Operasional |

**Uji:** matikan basis data instance A selama pengujian. Halaman verifikasi A tampil dengan salinan cache dalam waktu di bawah 2 detik. Instance B dan C tetap memakai salinan kesaksian yang sudah tersimpan.

---

## 12. Pengujian

| Lapisan | Yang diuji | Lulus jika |
| --- | --- | --- |
| Constraint | Invariant, nonnegatif, CHECK, UNIQUE, indeks parsial | Setiap pelanggaran ditolak |
| Fungsi SQL | Reservasi, konfirmasi, persetujuan, tulis log | Hasil sesuai tabel AC |
| Konkurensi | Dua draf bersamaan, konfirmasi dan persetujuan bersamaan | Tidak ada saldo negatif, tidak ada deadlock |
| Urutan kunci | Jalur paralel selama beberapa ribu iterasi | Tidak ada deadlock yang dilaporkan |
| Waktu kunci | `clock_timestamp()` pada `rantai_kepala` | Persentil 95 dilaporkan, target < 2 ms di lingkungan uji |
| JCS | Aplikasi dan SQL menghasilkan byte sama | Uji silang lulus |
| Rantai | Hitung ulang dari entri 1..n | Perubahan entri mana pun terdeteksi |
| Restore | Pemulihan ke titik sebelum hash terakhir | Papan silang menampilkan Tidak cocok |
| Jaringan | Tiga instance lokal | Kesaksian tersimpan, papan silang benar |
| End-to-end | Alur penyaluran dan skenario AC | Lulus |

**Catatan waktu kunci:** pengukuran di lingkungan demo (Vercel ke Supabase) akan lebih lama karena jaringan. Ini dilaporkan apa adanya. Pengukuran di dalam fungsi SQL adalah angka yang dibandingkan dengan target 2 ms.

---

## 13. Infrastruktur Demo

Tiga instance dijalankan dengan isolasi berikut:

| Komponen | Lembaga A | Lembaga B | Lembaga C |
| --- | --- | --- | --- |
| Proyek Supabase | Terpisah | Terpisah | Terpisah |
| Proyek Vercel | Terpisah | Terpisah | Terpisah |
| Redis | Terpisah | Terpisah | Terpisah |
| Kunci Ed25519 | Unik | Unik | Unik |
| Pepper | Unik | Unik | Unik |

**Jika kuota tidak memungkinkan:** gunakan tiga skema di satu proyek dengan tiga kunci berbeda, dan tulis di slide bahwa isolasi basis data belum berada pada tingkat proyek.

**Rahasia** disimpan di Vercel Environment Variables. Tidak ada rahasia di repositori. Direktori anggota (`direktori/anggota.json`) disepakati bersama dan berisi kunci publik.

---

## 14. Keputusan Desain

| ID | Keputusan | Alasan | Alternatif yang ditolak |
| --- | --- | --- | --- |
| ADR-01 | PostgreSQL dengan constraint dan fungsi SQL | Konsistensi saldo dan log dalam satu transaksi | Logika di aplikasi: jarak antara saldo dan log, dan jalur yang bisa dilewati |
| ADR-02 | Reservasi saldo saat draf dibuat | Dana yang dijanjikan tidak bisa dipakai dua kali | Kurangi saat disetujui: menghasilkan saldo negatif |
| ADR-03 | Urutan penguncian global `pos → penyaluran → rantai` | Mencegah deadlock | Tanpa urutan tetap: deadlock tidak bisa dicegah secara sistematis |
| ADR-04 | Penerbitan hash harian hanya mengunci `rantai_kepala` | Tidak membentuk siklus dengan transaksi saldo | Mengunci `pos_dana` saat penerbitan: membuka risiko siklus |
| ADR-05 | Logika penulisan log dalam fungsi SQL | Waktu kunci kecil, satu round trip | Query terpisah dari aplikasi: waktu kunci tidak terkendali |
| ADR-06 | JCS untuk log dan payload | Verifikator independen menghitung hash yang sama | JSON biasa: urutan kunci mengubah hash |
| ADR-07 | Hitung ulang dari log oleh papan silang | Perubahan oleh pemilik basis data tetap terlihat | Hanya membandingkan hash tersimpan: perubahan bisa disembunyikan |
| ADR-08 | Dua baris saksi dengan UNIQUE dan empat akun unik | Saksi tidak bisa dihitung dua kali | Satu baris dengan daftar saksi: sulit dijamin |
| ADR-09 | Asnaf diambil dari data mustahik | Asnaf tidak bisa dipalsukan oleh pembuat draf | Asnaf dari input: bisa dipalsukan |
| ADR-10 | Direktori disepakati bersama, tanpa otoritas pusat | Konsisten dengan klaim desentralisasi | CA atau otoritas pusat: bertentangan dengan narasi |
| ADR-11 | Duplikasi di roadmap | Pendekatan naif tidak aman | HMAC kunci bersama: rentan pencarian offline |
| ADR-12 | Tiga proyek basis data untuk demo | Isolasi data terlihat | Satu basis data: kesaksian tidak bermakna |
| ADR-13 | Redis hanya untuk cache dan rate limit | Data utama tidak bergantung cache | Redis sebagai penyimpanan utama |

---

## 15. Batasan Arsitektur

- Independensi organisasi belum terbukti. Demo dijalankan tim yang sama.
- Kesaksian bernilai selama saksi jujur. Jika mayoritas bersekongkol, kesaksian dapat dipalsukan.
- Perubahan sebelum hash pertama disaksikan tidak terdeteksi.
- Perubahan setelah `jumlah_entri` pada hari terakhir terdeteksi pada hari berikutnya, bukan segera.
- Pemilik basis data dapat mematikan trigger. Yang membuktikan perubahan adalah hash yang sudah disaksikan di luar basis data.
- Pemeriksaan duplikasi belum tersedia.
- Uang fisik tidak dilacak. Sistem membuktikan konfirmasi dan persetujuan, bukan keberadaan uang.

---

## 16. Pemetaan Kebutuhan ke Komponen

| Kode kebutuhan | Komponen |
| --- | --- |
| FR-01 sampai FR-08 | `pos_dana`, constraint invariant, `buat_draf_penyaluran` |
| FR-09 sampai FR-13 | `penerimaan`, hak amil, kode unik |
| FR-14 sampai FR-20 | `penyaluran`, `asnaf_enum`, status, `buat_draf_penyaluran` |
| FR-21 sampai FR-24 | `konfirmasi` metode mustahik, indeks parsial, tautan sekali pakai |
| FR-25 sampai FR-28 | `konfirmasi` metode saksi, UNIQUE, fungsi konfirmasi saksi |
| FR-29 sampai FR-31 | Fungsi persetujuan dengan urutan penguncian |
| FR-32 sampai FR-34 | `audit_log`, trigger, `tulis_log`, JCS |
| FR-35 sampai FR-37 | Urutan penguncian, pengukuran waktu kunci |
| FR-38 sampai FR-41 | `hash_harian`, cron, PK idempotent |
| FR-42 sampai FR-45 | Direktori, kesaksian, tanda tangan |
| FR-46 sampai FR-48 | Hitung ulang papan silang |
| FR-49 sampai FR-52 | Kebijakan restore, catatan insiden, status |
| FR-53 sampai FR-55 | Papan silang publik |
| FR-56 sampai FR-58 | Halaman verifikasi, penyamaran, peringatan |
| AV-01 sampai AV-04 | Cache, status menunggu, coba ulang, batas waktu |
