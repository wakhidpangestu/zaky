# Zaky

**Jaringan Verifikasi Penyaluran Zakat Antarlembaga**

Zaky adalah sistem pencatatan penyaluran zakat terfederasi dengan rantai audit kriptografis dan segregasi kewenangan empat mata. Setiap rupiah yang masuk dan keluar tercatat dalam buku besar yang tidak dapat diubah diam-diam, disaksikan lembaga lain, dan dapat diverifikasi ulang oleh siapa pun.

Demo: https://zakyapp.vercel.app
Karya untuk Web Development Competition UINIC 8.0 (HMPS Informatika UIN Sunan Kalijaga).

![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black)
![React](https://img.shields.io/badge/React-19.3-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Three.js](https://img.shields.io/badge/Three.js-0.186-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8)

## Masalah dan Solusi (Ringkasan PRD)

**Masalah.** Pencatatan zakat di banyak lembaga masih tersebar di spreadsheet dan aplikasi tertutup. Catatan dapat diubah tanpa jejak, tidak ada salinan pembanding di luar lembaga, dan publik tidak punya cara memeriksa apakah penyaluran yang diumumkan sama dengan yang tercatat. Kepercayaan donatur bertumpu pada reputasi, bukan pada bukti.

**Solusi.** Zaky memindahkan kepercayaan dari reputasi ke kriptografi:

1. **Segregasi empat mata.** Pembuat draf, dua saksi independen dari unit berbeda, dan penyetuju keuangan harus orang dan unit yang berbeda. Aturan ini ditegakkan oleh constraint basis data, bukan oleh tata tertib.
2. **Invariant saldo yang tidak bisa dilanggar.** Setiap pos dana selalu memenuhi `total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan`, ditegakkan CHECK constraint dan stored procedure PostgreSQL.
3. **Rantai hash append-only.** Setiap peristiwa keuangan dirantai dengan SHA-256 ke peristiwa sebelumnya. Mengubah satu baris lama merusak seluruh rantai setelahnya dan terdeteksi oleh hitung ulang.
4. **Hash harian bertanda tangan Ed25519.** Kepala rantai setiap hari ditandatangani dan disaksikan lembaga peer (Papan Silang), sehingga lembaga tidak dapat menulis ulang sejarahnya sendiri tanpa ketahuan lembaga lain.
5. **Verifikasi publik.** Setiap penyaluran memiliki kode 12 karakter yang dapat dicek siapa pun, dan penerima (mustahik) mengonfirmasi penerimaan lewat tautan token pribadi atau dua saksi lapangan.

**Pengguna sasaran.** Lembaga amil zakat dan unit pengumpul zakat (pencatatan dan persetujuan), donatur dan publik (verifikasi), serta lembaga peer dalam jaringan (kesaksian silang).

**Aturan fikih yang dikodekan.** Delapan golongan asnaf QS At-Taubah ayat 60 sebagai enum basis data; hak amil maksimal 12,50% dari penerimaan dan dihitung otomatis; asnaf penyaluran wajib sama dengan asnaf mustahik terdaftar; identitas mustahik disamarkan untuk publik (kesesuaian UU PDP).

## Fitur Utama

- **Penerimaan dan penyaluran** dengan alur draf, dua saksi, persetujuan, dan konfirmasi penerima, termasuk cadangan dana 72 jam dan pembatalan berjejak.
- **Workflow kantor bersama**: antrean work item dari basis data, klaim dan serah-terima tugas dengan histori, presence petugas, dan pembaruan langsung via SSE dengan cadangan polling.
- **Dua mode kerja di atas data yang sama**: Mode Standar (dasbor kartu yang dapat disusun ulang) dan Zaky Simulator (kantor 3D interaktif berbasis Three.js dengan meja kerja yang membuka alat yang sama). Mode dapat diganti kapan pun tanpa memindahkan data.
- **Beranda sinematik** dengan perjalanan scroll 3D, direktori peran, dan wizard pencatatan yang dapat dibuka publik dalam mode demo.
- **Papan Silang publik**: hash harian antarlembaga, status kesaksian berkode ikon dan teks, dan mode simulasi manipulasi untuk mendemonstrasikan deteksi perubahan data.
- **Verifikasi dan cetak**: halaman verifikasi per kode, dokumen cetak resmi, kode QR pada bukti, dan ekspor kalender (ICS).
- **Chat kantor antarpetugas** dalam lembaga, dibatasi laju dan digerbang konfigurasi.
- **Unggahan bukti privat** maksimal 5 MB dengan pemeriksaan MIME, signature berkas, dan SHA-256.

## Arsitektur

Zaky memakai arsitektur berlapis dengan satu prinsip utama: **aturan keuangan hidup di basis data**, sehingga tidak ada jalur aplikasi yang dapat melewatinya.

```
Publik / Amil / Penyetuju
        |
        v
Presentation        Next.js App Router (React Server Components)
  - Route groups: (amil), (penyetuju), publik, verifikasi, silang
  - Journey 3D + Simulator (Three.js, lazy-load setelah interaksi)
  - Mode Standar (dasbor kartu, drag-and-drop dnd-kit)
        |
        v
Application         Server Actions + Route Handlers (src/app/api)
  - Sesi JWT HS256 (jose), cookie httpOnly, middleware gerbang rute
  - API office: workflow, operations, chat, dashboard SSE
  - API jaringan: kesaksian Ed25519, papan silang, hash harian
  - Validasi zod, rate limit, idempotensi requestId + advisory lock
        |
        v
Domain (di PostgreSQL)
  - Stored procedure: catat_penerimaan, buat_draf_penyaluran,
    append_audit_log, office_assign_work, office_confirm_recipient
  - CHECK constraint: invariant saldo, hak amil <= 12,50%,
    kesesuaian asnaf, pemisahan pembuat/saksi/penyetuju
  - Audit log append-only (trigger menolak UPDATE/DELETE)
        |
        v
Infrastructure
  - Kripto: kanonikalisasi JCS (RFC 8785), tanda tangan Ed25519,
    rantai SHA-256, HMAC-SHA256 untuk token dan privasi mustahik
  - Jaringan: direktori anggota, protokol kesaksian, hitung ulang
    rantai independen (SQL dan TypeScript)
  - Data: pg.Pool server-side; tabel office dilindungi RLS aktif
    tanpa policy + REVOKE dari peran publik (deny-by-default)
```

Keputusan arsitektur penting:

- **Satu mesin workflow** melayani mode standar, papan kerja, kantor 3D, dan wizard. Tidak ada demo terpisah yang menyimpang dari data produksi.
- **Dua mesin hitung ulang rantai** (fungsi SQL `hitung_ulang_rantai()` dan verifikator TypeScript) memeriksa hal yang sama dari jalur berbeda.
- **Gagal tertutup (fail-closed)**: server produksi menolak start bila `JWT_SECRET` lemah atau termasuk nilai contoh yang pernah terbit; fitur kantor hanya aktif bila flag dan pengakuan mode demo sama-sama terpasang.
- **Realtime berlapis**: SSE sebagai jalur utama, polling 10 detik sebagai cadangan, dan snapshot terakhir tetap tampil saat koneksi putus.

## Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| Framework | Next.js 16.4.3 (App Router, Turbopack), React 19.3, TypeScript 5 |
| Styling | Tailwind CSS 4, Radix UI (accordion), Lucide icons |
| 3D dan motion | Three.js 0.186, Framer Motion, GSAP |
| Basis data | PostgreSQL 16 (Supabase atau Docker lokal), stored procedure PL/pgSQL, pgcrypto |
| Autentikasi | JWT HS256 dengan jose, cookie httpOnly |
| Kriptografi | Ed25519 dan SHA-256 (node:crypto), kanonikalisasi JCS RFC 8785 |
| Validasi | Zod 4 |
| Pengujian | node --test, skrip uji TypeScript, PGlite (PostgreSQL WASM) untuk uji integrasi, Playwright |
| Deployment | Vercel (cron harian untuk penerbitan hash), Docker Compose untuk basis data lokal |

## Design System

Sistem desain Zaky dibangun di atas identitas lembaga zakat yang tenang dan dapat dipercaya: kertas hangat, tinta hijau tua, dan aksen emas.

**Warna merek**

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| Zamrud merek | `#0F5C4D` | Identitas merek, themeColor, status tersalurkan |
| Zamrud tua | `#0A3F35` | Blok gelap, footer, sampul dokumen |
| Emas | `#C8962E` | Aksen, garis pemisah, penanda penting |
| Kertas | `#F7F4ED` | Latar hangat dokumen dan kartu |
| Tinta | `#14201D` | Teks utama di atas kertas |
| Primer UI | `hsl(142, 76%, 36%)` | Tombol dan elemen interaktif dasbor |

**Warna status** selalu berpasangan latar dan teks, dan selalu disertai ikon dan teks (tidak pernah warna saja):

| Status | Latar | Teks |
| --- | --- | --- |
| Dibuat | `#EEF2F7` | `#3B4A5E` |
| Menunggu | `#FDF3DC` | `#7A5A0B` |
| Dikonfirmasi | `#E6EEF8` | `#1D4E89` |
| Ditolak | `#FBE4E4` | `#9B1C1C` |
| Tersalurkan | `#D7F0E8` | `#0F5C4D` |
| Peringatan | `#FFF1E0` | `#8A4B08` |

**Tipografi.** Outfit (400-800) untuk teks dan JetBrains Mono untuk kode, hash, dan angka teknis. Kedua font self-hosted sebagai woff2 dengan fallback metrik-tersesuaikan agar tidak menggeser tata letak.

**Prinsip gerak dan akses.** Animasi tenang dengan spring pendek; semua jalur animasi menghormati `prefers-reduced-motion`; canvas WebGL diberi label ARIA deskriptif; fokus keyboard selalu terlihat; ada fallback ilustrasi CSS penuh bila WebGL tidak tersedia.

## Struktur Repositori

```
src/
  app/            Route App Router: (amil), (penyetuju), api, publik
  components/     journey (beranda 3D), office (dasbor & simulator),
                  workflow (wizard & antrean), ui
  lib/            auth, sesi, rate-limit, jaringan, office, cetak
  domain/         Aturan domain sisi aplikasi
  application/    Use-case dan port
  infrastructure/ kripto (JCS, Ed25519), log, jaringan, penyimpanan
db/migrations/    Migrasi PostgreSQL 001-008 (skema, seed demo,
                  stored procedure, chat, workflow, operasi, jaringan)
scripts/          migrate-supabase.ts, konkurensi.ts, pembuat aset
tests/            domain, kripto, kunci, serangan, jaringan,
                  office, experience, e2e
direktori/        anggota.json: direktori kunci publik lembaga jaringan
```

## Memulai

Prasyarat: Node.js 20+, Docker (untuk basis data lokal), atau sebuah proyek Supabase.

```bash
# 1. Basis data lokal PostgreSQL 16 di port 5433
#    (migrasi 001-008 berjalan otomatis pada volume kosong)
npm run db:up

# 2. Pasang dependensi dan siapkan env
npm install
cp .env.example .env.local   # isi JWT_SECRET dan CRON_SECRET acak >= 32 karakter

# 3. Jalankan
npm run dev:local            # db:up + next dev
```

Untuk Supabase: jalankan `npm run db:migrate` (runner bermigrasi tercatat di tabel `schema_migrations`; gunakan `--baseline=` eksplisit untuk basis data lama dan `--skip-demo` agar seed demo tidak masuk lembaga sungguhan).

**Akun demo** (mode evaluasi; satu kata sandi `demo123`):

| Email | Peran |
| --- | --- |
| budi@lembaga-a.test | Amil |
| hari@lembaga-a.test | Amil |
| dewi@lembaga-a.test | Penyetuju |
| rian@lembaga-a.test | Admin |

**Variabel lingkungan utama**

| Variabel | Fungsi |
| --- | --- |
| `DATABASE_URL` / `POSTGRES_URL` | Koneksi PostgreSQL |
| `JWT_SECRET` | Penandatanganan sesi HS256, wajib acak dan kuat |
| `CRON_SECRET` | Pelindung endpoint cron penerbitan hash harian |
| `APP_URL` | Origin persis aplikasi untuk pemeriksaan origin POST |
| `OFFICE_WORKFLOW_ENABLED`, `OFFICE_WORKFLOW_DEMO_ACK` | Mengaktifkan workflow kantor mode demo |
| `ZAKY_ED25519_SEED_A/B/C` | Seed kunci penandatanganan per lembaga (hex 64 karakter); tanpa ini dipakai kunci demo |

## Pengujian

```bash
npm run test:office   # 11 berkas uji kantor: kontrak, workflow, operasi, keamanan, simulator
npm run test:all      # domain, kripto, kunci, serangan, jaringan, konkurensi
npm run build         # build produksi
```

Hasil terverifikasi per 30 Oktober 2026: `test:office` 103 lulus dan 0 gagal; seluruh suite `test:all` lulus, termasuk simulasi konkurensi reservasi saldo (klaim paralel yang melebihi saldo ditolak dan invariant terpelihara) dan uji serangan manipulasi log (perubahan catatan terdeteksi oleh hitung ulang rantai dan ketidakcocokan hash terbit).

Catatan cakupan: sebagian suite domain berjalan sebagai model logika di memori; uji yang menyentuh basis data sungguhan ada pada `tests/office` (operations-db, workflow-db) dan `tests/experience`. Konkurensi PostgreSQL native multi-koneksi adalah pekerjaan staging berikutnya.

## Status dan Batasan

Zaky saat ini adalah **karya lomba dalam mode demo terverifikasi**, bukan sistem produksi:

- Login memakai akun demo berkredensial terbit untuk evaluasi juri. Jalur autentikasi produksi berbasis `akun.password_hash` (Argon2id sesuai PRD) adalah langkah pertama menuju produksi.
- Federasi berjalan sebagai simulasi dalam satu deployment: ketiga kunci lembaga berada di satu server dan kunci demo diturunkan dari teks terbuka bila seed rahasia tidak dipasang. Protokol kesaksiannya sendiri siap dipisah per lembaga.
- Belum ada pembayaran atau transfer dana nyata; Zaky adalah sistem pencatatan dan verifikasi, bukan pemindah uang.

Peta jalan: autentikasi produksi, pemisahan kunci dan persistensi kesaksian antar-server, uji konkurensi PostgreSQL native di staging, lalu pendampingan adopsi lembaga pertama.

## Tim

Zaky dikembangkan oleh Tim Zaky, mahasiswa Teknik Informatika Universitas Indraprasta PGRI (UNINDRA):

- Wakhid Pangestu (ketua tim)
- Ahmad Dandi Subhani
- Rendy Setiawan

Dokumen internal proyek (PRD lengkap, arsitektur rinci, laporan pengujian, dan audit) dikelola terpisah dari repositori ini; README ini adalah ringkasan resminya.
