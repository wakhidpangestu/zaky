# Zaky

**Setiap lembaga mencatat sendiri, tetapi catatannya saling disaksikan.**

Zaky adalah sistem pencatatan penyaluran zakat untuk lembaga zakat berizin. Zaky mewajibkan setiap penyaluran dicatat oleh amil, dikonfirmasi oleh penerima, dan disetujui oleh unit lain. Setiap catatan dihubungkan ke rantai audit yang bisa diverifikasi di luar basis data.

Proyek ini dikembangkan untuk **Web Development Competition UINIC 8.0** dengan tema _Engineering Interconnected Web Solutions to Empower Digital Ecosystems_ dan subtema **Sosial Budaya**.

> **Catatan penting:** Zaky adalah prototipe lomba. Seluruh data dalam repositori ini adalah data simulasi. Zaky bukan produk resmi BAZNAS, Kemenag, atau lembaga zakat mana pun, dan tidak memproses pembayaran.

---

## Status Pengembangan

Increment antarmuka terbaru: [pengalaman video, formulir bersama dan panduan migrasi 006](docs/06-VIDEO-EXPERIENCE.md). Alur HTTP/database telah diuji; verifikasi browser lengkap dan autentikasi produksi masih diperlukan.

| Komponen                       | Status                          | Keterangan                                                                  |
| ------------------------------ | ------------------------------- | --------------------------------------------------------------------------- |
| Skema basis data (PostgreSQL)  | Selesai                         | Tabel, constraint, indeks, trigger append-only                              |
| Fungsi bisnis (SQL)            | Selesai                         | Penerimaan, reservasi, konfirmasi, persetujuan, pembatalan                  |
| Rantai audit SHA-256           | Selesai                         | Dihitung ulang oleh verifikator di luar basis data                          |
| Verifikator rantai (Node.js)   | Selesai                         | Mendeteksi manipulasi data, sambungan, dan kepala rantai                    |
| Hash harian Ed25519            | Terbit manual satu kali         | Belum terjadwal                                                             |
| Uji konkurensi dua koneksi     | Selesai untuk pola uji tertentu | Penguncian baris `FOR UPDATE`, isolasi READ COMMITTED                       |
| Antarmuka web                  | Sebagian                        | Halaman dasbor, penyaluran, verifikasi, dan papan silang dalam pengembangan |
| Kesaksian antarlembaga (P2P)   | Roadmap                         | Spesifikasi protokol sudah ada, belum berjalan                              |
| Pemeriksaan duplikasi mustahik | Roadmap                         | Membutuhkan OPRF atau PSI, lihat bagian Roadmap                             |

---

## Masalah yang Dijawab

Kepercayaan muzakki bergantung pada satu pertanyaan: apakah dana benar-benar sampai kepada mustahik yang berhak, dan hanya sekali? Dua kelemahan membuat pertanyaan itu sulit dijawab:

1. **Catatan internal mudah berubah tanpa jejak.** Penyaluran sering dicatat dalam dokumen yang diunggah berkala, sehingga pihak luar tidak bisa mengetahui apakah catatan itu pernah diubah.
2. **Tidak ada pihak lain yang menyimpan salinan catatan.** Lembaga yang mengubah catatan tidak menghadapi pembanding apa pun di luar dirinya.

Zaky tidak menggantikan integritas pengurus. Zaky membuat setiap penyaluran membutuhkan bukti dari lebih dari satu pihak, dan membuat perubahan catatan lebih sulit dilakukan tanpa terlihat.

---

## Fitur Inti

### A. Pos Dana dengan Reservasi Saldo

- Setiap pos dana memiliki empat angka: total masuk, saldo tersedia, saldo dicadangkan, dan total tersalurkan.
- Invariant `total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan` dijaga constraint database.
- Saat draf penyaluran dibuat, dana langsung dicadangkan. Dua draf bersamaan tidak bisa memakai saldo yang sama.
- Draf yang ditolak, dibatalkan, atau kedaluwarsa melepas reservasi.
- Hak amil dipisah dari setiap penerimaan dengan batas persentase per lembaga (default 12,50 persen).

### B. Penyaluran dengan Konfirmasi dan Persetujuan

Setiap penyaluran membutuhkan tiga pihak yang berbeda. Ada dua metode konfirmasi:

**Metode mustahik (berponsel):**

- Mustahik menerima tautan konfirmasi sekali pakai yang berlaku 72 jam.
- Aplikasi membuat token acak dan hanya menyimpan hash-nya di basis data. Token mentah dikirim ke mustahik lewat pesan.

**Metode saksi (tanpa ponsel):**

- Dua saksi harus mengonfirmasi, masing-masing dari akun amil yang berbeda.
- Saksi tidak boleh sama dengan amil pembuat, dan unitnya harus berbeda.

**Persetujuan:**

- Penyetuju harus memiliki peran `penyetuju`, akun aktif, dan unit berbeda dari seluruh pihak sebelumnya.
- Penyetuju tidak boleh sama dengan saksi mana pun.

### C. Rantai Audit dan Verifikasi

- Setiap perubahan status tercatat di `audit_log` yang bersifat append-only. Trigger database menolak `UPDATE` dan `DELETE`.
- Setiap entri menyimpan hash SHA-256 yang mengikat seluruh isi entri dan hash entri sebelumnya.
- Verifikator independen di Node.js menghitung ulang setiap hash tanpa bergantung pada fungsi database.
- Kepala rantai dapat diterbitkan sebagai hash harian dan ditandatangani dengan Ed25519.

---

## Arsitektur

```
Lembaga (satu instance)
┌──────────────────────────────────────────────────────────────┐
│  Antarmuka web (Next.js)                                     │
│        │                                                     │
│        ▼                                                     │
│  PostgreSQL                                                  │
│    ├─ tabel: pos_dana, penerimaan, penyaluran, konfirmasi    │
│    ├─ fungsi SQL: reservasi, konfirmasi, persetujuan, log    │
│    ├─ audit_log (append-only) dan rantai_kepala              │
│    └─ hash_harian (Ed25519)                                  │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
Verifikator independen (Node.js): menghitung ulang hash dari audit_log
```

### Urutan Penguncian Global

Setiap transaksi mengunci baris dalam urutan yang sama untuk mencegah siklus tunggu:

```
pos_dana  →  penyaluran  →  rantai_kepala
```

Penerbitan hash harian hanya mengunci `rantai_kepala`, sehingga tidak pernah membentuk siklus dengan transaksi saldo.

### Logika di Server Basis Data

Reservasi saldo, konfirmasi, persetujuan, dan penulisan log dijalankan sebagai fungsi tersimpan dalam satu transaksi. Dengan begitu, perubahan saldo dan pencatatan log tidak bisa terpisah.

| Fungsi                 | Tugas                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| `catat_penerimaan`     | Mencatat penerimaan dan memisahkan hak amil                        |
| `buat_draf_penyaluran` | Mereservasi saldo dan menyimpan hash token mustahik                |
| `konfirmasi_mustahik`  | Memverifikasi token, mengonfirmasi, atau mengembalikan kedaluwarsa |
| `konfirmasi_saksi`     | Mencatat konfirmasi saksi dengan aturan unit dan peran             |
| `setujui_penyaluran`   | Memindahkan dana dari dicadangkan ke tersalurkan                   |
| `batalkan_penyaluran`  | Membatalkan draf milik amil pembuat dan melepas reservasi          |
| `append_audit_log`     | Menulis entri rantai audit dan mengunci kepala rantai              |

---

## Aturan Bisnis Utama

| Aturan                                       | Yang ditegakkan                       |
| -------------------------------------------- | ------------------------------------- |
| Dana tidak boleh disalurkan dua kali         | Reservasi dengan penguncian baris     |
| Saldo tidak boleh negatif                    | Constraint database                   |
| Pembuat tidak boleh menyetujui sendiri       | Pemeriksaan fungsi                    |
| Saksi harus dari unit berbeda dengan pembuat | Pemeriksaan fungsi                    |
| Setiap saksi harus dari unit yang berbeda    | Pemeriksaan fungsi (keputusan N1)     |
| Penyetuju harus dari unit berbeda dari saksi | Pemeriksaan fungsi (keputusan N1)     |
| Saksi hanya boleh berperan `amil`            | Pemeriksaan fungsi (keputusan N2)     |
| Token mustahik hanya bisa dipakai sekali     | Token hash dan penanda `dipakai_pada` |
| Tautan konfirmasi kedaluwarsa setelah 72 jam | Pemeriksaan waktu di fungsi           |
| Penyaluran tersalurkan wajib punya penyetuju | Constraint database                   |

---

## Keamanan dan Batasan yang Diakui

Zaky mendeteksi perubahan, tetapi tidak mencegah pemilik basis data yang berniat jahat. Batasan berikut sengaja dicantumkan:

- **Pemilik basis data (superuser) dapat mematikan trigger dan menulis ulang rantai dari awal.** Perubahan seperti ini tetap terdeteksi jika kepala rantai sebelumnya sudah dicatat di luar sistem. Pembuktian final membutuhkan kesaksian antarlembaga, yang masih roadmap.
- **Verifikator hanya membuktikan konsistensi kriptografis.** Jika seluruh rantai ditulis ulang tanpa jangkar eksternal, verifikator tidak bisa membedakannya dari rantai asli.
- **Kunci privat Ed25519 harus dikelola di luar basis data.** Repositori ini tidak menyimpan kunci privat.
- **Konkurensi diuji dengan pola tertentu.** Pengujian dua koneksi tidak membuktikan ketiadaan deadlock untuk semua kombinasi query.
- **Zaky tidak membuktikan uang sampai ke tangan mustahik.** Zaky membuktikan bahwa konfirmasi dan persetujuan tercatat dan tidak diubah diam-diam.
- **Seluruh data demo adalah simulasi.** Nama, email, dan nomor dalam seed adalah contoh.

---

## Design System

Antarmuka Zaky dirancang tenang, jelas, dan mudah dipercaya. Prinsipnya: bukti harus terlihat, status tidak hanya dibedakan dengan warna, dan istilah fiqih dipakai dengan penjelasan singkat.

### Palet Utama

| Token                | Hex       | Penggunaan                           |
| -------------------- | --------- | ------------------------------------ |
| `--zaky-primary-700` | `#0F5C4D` | Tombol utama, header, tautan aktif   |
| `--zaky-primary-100` | `#D7F0E8` | Latar status positif                 |
| `--zaky-accent-500`  | `#C8962E` | Aksen kecil, maksimal 5 persen layar |
| `--zaky-neutral-900` | `#14201D` | Teks utama                           |
| `--zaky-neutral-50`  | `#F6F8F7` | Latar halaman                        |
| `--zaky-surface`     | `#FFFFFF` | Latar kartu                          |

### Status Penyaluran

Setiap status memiliki warna, ikon, dan teks:

| Status                       | Arti                                      |
| ---------------------------- | ----------------------------------------- |
| Dibuat / menunggu konfirmasi | Saldo sudah dicadangkan                   |
| Dikonfirmasi                 | Konfirmasi lengkap, menunggu persetujuan  |
| Tersalurkan                  | Sah dan dihitung sebagai dana tersalurkan |
| Ditolak penerima             | Mustahik atau saksi menolak               |
| Kedaluwarsa / dibatalkan     | Reservasi dilepas                         |

### Status Verifikasi

| Status            | Arti                                          |
| ----------------- | --------------------------------------------- |
| Terkonfirmasi     | Hash harian cocok dan disaksikan lembaga lain |
| Belum cukup saksi | Kurang dari dua kesaksian                     |
| Tidak cocok       | Ada perbedaan hash                            |
| Belum diterbitkan | Hash harian belum terbit                      |

Status "Tidak cocok" memakai oranye, bukan merah. Merah dicadangkan untuk penolakan yang dilakukan pengguna.

### Tipografi

- Sans: Plus Jakarta Sans
- Mono: JetBrains Mono, untuk kode unik dan hash
- Ukuran teks minimal 14 piksel. Halaman konfirmasi mustahik menggunakan minimal 18 piksel.

Token lengkap ada di dokumen desain di folder `docs/`.

---

## Struktur Repositori

```
zaky/
├── db/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql       # Skema, constraint, trigger
│   │   ├── 002_seed_demo.sql            # Data simulasi
│   │   └── 003_stored_procedures.sql    # Fungsi bisnis
├── scripts/                             # Verifikator, uji konkurensi, uji negatif, penerbitan hash
├── tests/
│   └── konkurensi/                      # Pengujian konkurensi
├── src/                                 # Antarmuka web (Next.js)
├── public/
├── Zaky-Proposal-v4.md                  # Proposal lomba
├── Zaky-PRD-v4.md                       # Product requirements
├── Zaky-Architecture-v4.md              # Arsitektur teknis
└── Zaky-Design-System-v3.md             # Design system
```

---

## Menjalankan Secara Lokal

### Prasyarat

- Docker
- Node.js 22 atau lebih baru
- npm

### 1. Jalankan basis data uji

```bash
docker run -d --name zaky-uji -e POSTGRES_PASSWORD=uji -p 5432:5432 postgres:16
until docker exec zaky-uji pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
```

### 2. Terapkan migrasi

Migrasi dijalankan berurutan. Jika salah satu gagal, proses berhenti.

```bash
docker exec -i zaky-uji psql -U postgres -v ON_ERROR_STOP=1 < db/migrations/001_initial_schema.sql \
  && docker exec -i zaky-uji psql -U postgres -v ON_ERROR_STOP=1 < db/migrations/002_seed_demo.sql \
  && docker exec -i zaky-uji psql -U postgres -v ON_ERROR_STOP=1 < db/migrations/003_stored_procedures.sql \
  && echo "MIGRASI BERHASIL"
```

### 3. Periksa skema dan data seed

```bash
docker exec -i zaky-uji psql -U postgres -c "SELECT extname FROM pg_extension;"
docker exec -i zaky-uji psql -U postgres -c "SELECT nama FROM unit;"
docker exec -i zaky-uji psql -U postgres -c "SELECT nama, peran, unit_id FROM akun;"
```

Hasil yang diharapkan: ekstensi `pgcrypto` terpasang, ada empat unit, dan empat akun dengan peran `amil` atau `penyetuju`.

### 4. Atur variabel lingkungan

```bash
export DATABASE_URL_UJI="postgresql://postgres:uji@localhost:5432/postgres"
```

Jangan pernah memasukkan kunci privat atau kata sandi produksi ke repositori.

---

## Pengujian dan Verifikasi

| Pengujian                 | Perintah                                       | Yang dibuktikan                                             |
| ------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Konkurensi dua koneksi    | `node scripts/test_konkurensi_dua_koneksi.js`  | Dua draf bersamaan pada saldo terbatas, hanya satu berhasil |
| Verifikasi rantai         | `node scripts/verifikasi_audit_independen.js`  | Setiap hash dihitung ulang di luar basis data               |
| Uji negatif               | `node scripts/test_uji_negatif_verifikator.js` | Verifikator menolak manipulasi yang disimulasikan           |
| Verifikasi berkas offline | `node scripts/verifikasi_berkas_offline.js`    | Berkas ekspor konsisten tanpa koneksi basis data            |
| Penerbitan hash harian    | `npx tsx scripts/terbitkan_hash_harian.ts`     | Penerbitan dan verifikasi tanda tangan Ed25519              |

Catatan: `tests/konkurensi/test_reservasi_saldo.ts` adalah simulasi di memori untuk mendemonstrasikan logika. Ia tidak menyentuh basis data dan bukan bukti integritas. Bukti konkurensi yang sah ada di `scripts/test_konkurensi_dua_koneksi.js`.

---

## Roadmap

**Versi berikutnya**

- Kesaksian hash harian antarlembaga melalui protokol yang ditandatangani
- Penerbitan hash harian terjadwal
- Pemeriksaan duplikasi mustahik lintas lembaga, dengan OPRF atau PSI, tanpa kunci bersama

**Setelah itu**

- Zakat fitrah dalam bentuk beras atau makanan pokok
- Wakaf, dengan akad, nazhir, dan pelaporan aset
- Dasbor muzakki dan notifikasi penyaluran
- Penyimpanan kunci di HSM atau layanan kunci terkelola
- Integrasi dengan sistem pelaporan resmi lembaga zakat

---

## Dokumen Terkait

- [Proposal](Zaky-Proposal-v4.md): latar belakang, analisis, dan rencana lomba
- [PRD](Zaky-PRD-v4.md): kebutuhan fungsional, acceptance criteria, dan rencana rilis
- [Arsitektur](Zaky-Architecture-v4.md): skema, urutan penguncian, dan protokol jaringan
- [Design System](Zaky-Design-System-v3.md): palet, tipografi, dan komponen

---

## Penggunaan AI dalam Pengembangan

Sebagian kode dan dokumen dibuat dengan bantuan agen AI (Claude Code dan alat lain), di bawah arahan dan tinjauan pengembang. Keputusan arsitektur, aturan bisnis, dan pengujian diverifikasi oleh tim. Keterbukaan ini dicantumkan sesuai prinsip orisinalitas karya.

---

## Lisensi dan Kontak

- Lisensi: [isi, misalnya MIT]
- Tim: [isi nama tim dan instansi]
- Kontak: [isi email]

Proyek ini dikembangkan untuk kepentingan lomba dan belum dirancang untuk produksi.
