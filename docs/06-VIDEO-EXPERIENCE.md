# Pengalaman video dan pencatatan bersama

Increment pada `feature/kantor-3d-review`, melanjutkan commit `f7f6dde7bd38abec4dd0f728a0db322f0dda561a`. Identitas dan proses tetap Zaky sesuai pilihan pengguna. Pemetaan video per waktu ada di [spesifikasi](superpowers/specs/2026-10-27-video-reference.md).

## Perubahan yang tersedia

- Landing krem/hitam/oranye: navbar kapsul, gedung isometrik, perjalanan kamera/karakter mengikuti scroll, lima ruang layanan, kartu konteks dan navigasi bab. Renderer dan pembangun model dipakai bersama dengan Kantor 3D.
- Pelacakan kode tersimpan, kartu layanan, direktori peran dengan filter, preview web seluler, tiga pilihan cara kerja, perbandingan, proses pemeriksaan dan CTA. Tidak ada GPS, rating, mitra atau pembayaran rekaan.
- Dialog lima tahap untuk penerimaan dan draf penyaluran. Halaman penuh serta kedua mode memakai wizard dan detail yang sama; panel kerja tidak lagi memakai iframe.
- Penerimaan/draf/saksi/persetujuan/pembatalan menggunakan fungsi keuangan PostgreSQL asli. Nominal tetap string desimal; hak amil dibulatkan ke bawah ke sen, dengan persentase dan jumlah tetap di bawah batas lembaga.
- Unggahan bukti privat dibatasi 5 MB; MIME dan signature bytes diperiksa, hash SHA-256 dihitung server. Bukti harus milik pembuat dalam lembaga yang sama ketika dipakai pada draf.
- Hasil tersimpan menyediakan QR, tautan record tepat, cetak/PDF lewat browser, dan ICS tenggat sumber. Ini bukti pencatatan, bukan bukti pembayaran bank.
- Tautan mustahik berasal dari HMAC terpisah tujuan dan hanya hash token disimpan. Pembuat yang masih berperan amil dapat membukanya kembali selama pending, belum dipakai dan belum kedaluwarsa; hasil rekonstruksi dicocokkan dengan hash tersimpan. Rotasi JWT secret menonaktifkan rekonstruksi tautan lama; tidak ada fallback atau penggantian tautan diam-diam.
- Assignment/handoff, versi optimistis, history dan presence tetap berasal dari workflow 005. SSE kini mencoba kembali setelah event `unavailable` dengan backoff 1–30 detik, berhenti saat hidden/offline/unmount, lalu memuat kewenangan dan snapshot lagi.
- Pencarian mustahik di server menampilkan maksimal 100 hasil dengan penanda hasil tambahan; nama samaran, kabupaten dan asnaf dapat dicari.

## Memasang pada database uji

1. Pertahankan migrasi 001 dan 003 serta data yang sudah ada. Seed 002 hanya untuk database demo kosong, jangan dijalankan ulang pada database berisi data.
2. Pastikan 005 sudah terpasang. Jalankan `psql -v ON_ERROR_STOP=1 -f db/migrations/006_office_operations.sql` sekali. Migrasi 006 berada dalam satu transaksi dan menambah metadata privat penerimaan, penyimpanan bukti, idempotency operasi dan fungsi wrapper. Migrasi 004 tetap hanya untuk chat.
3. Gunakan konfigurasi server dalam `docs/office.env.example`: koneksi database uji, JWT secret acak minimal 32 karakter, `APP_URL` tepat sama dengan origin, serta kedua flag workflow. Backend memerlukan owner tabel/fungsi atau izin server yang sesuai; akses `PUBLIC`, `anon`, dan `authenticated` dicabut.
4. Restart aplikasi. Tanpa migrasi/koneksi/flag, tampilkan status tidak tersedia; data browser lama tidak diimpor menjadi keuangan.
5. Rollback aplikasi: matikan flag workflow lebih dahulu. Pertahankan bukti, idempotency dan audit. Penghapusan data/schema memerlukan backup dan prosedur DBA tersendiri.

Runner `npm run db:migrate` lama hanya menjalankan 001–003. Jangan memakainya untuk update database yang sudah ada. Tugas ini tidak menjalankan migrasi atau deployment produksi.

## Pengujian

| Jalur             | Perintah                                                 | Cakupan                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain lama       | `npm run test:all`                                       | Domain, kripto, urutan lock, serangan, jaringan dan simulasi konkurensi lama                                                                                             |
| Unit dan SQL      | `npm run test:office`                                    | Kamera, parser, stream retry/cleanup, fungsi finansial asli, idempotency, pemilik/versi/peran/tenant, bukti dan token                                                    |
| HTTP terintegrasi | `ZAKY_FRESH_TEST_CACHE=true npm run test:experience:api` | Next server + PGlite socket terisolasi; JWT/origin, penerimaan, upload, assignment/handoff, dua saksi, approval, record privat/publik, pemulihan token, presence dan SSE |
| Browser           | `npm run test:experience`                                | Scroll, keyboard/dialog, wizard, QR, lintas akun, mobile/reduced motion, fallback dan reconnect                                                                          |

Untuk uji browser, pasang Chromium Playwright dengan `npx playwright install --with-deps chromium` pada lingkungan yang mengizinkan unduhan. Alternatif: set `BROWSER_EXECUTABLE_PATH` ke executable Chromium yang kompatibel. Fixture memakai port acak dan secret baru per proses; tidak memakai akun/database eksternal. Hasil sementara ada dalam `.next/experience-results/` dan tidak disimpan ke git.

## Hasil dan batas verifikasi

Hasil perintah dicatat di [bukti pengujian](evidence/video-experience-verification.txt): 76 uji office lulus, suite domain lama lulus, TypeScript, lint seluruh file kode yang diubah dan production build lulus. Lint seluruh repo masih memiliki 77 error dan 129 warning di luar perubahan ini. Alur HTTP terintegrasi sudah lulus termasuk request replay, penyerahan tugas, dua saksi, persetujuan dan konfirmasi mustahik. Pemeriksaan reviewer independen menemukan dan memperbaiki hak pembatalan setelah perubahan peran, pembulatan hak amil, serta tautan mustahik yang tidak tersedia kembali.

Uji browser lengkap belum lulus pada increment ini. Sesi awal hanya membuktikan navigasi scroll dan fokus/Escape dialog; alur formulir berhenti pada sesi browser. Setelah resume, executable Chromium sementara tidak tersedia dan permintaan unduh ulang ditolak kebijakan lingkungan. Fixture kini memakai origin/port terisolasi serta konfigurasi cookie yang sesuai; perbaikan ini masih perlu diuji dengan Chromium. Jangan memakai screenshot sesi awal sebagai bukti visual final atau menyatakan kesamaan piksel dengan video.

PGlite adalah mesin PostgreSQL WASM dan tidak membuktikan deadlock/lock lintas koneksi PostgreSQL native. Masih perlu uji browser akhir, pemeriksaan visual desktop/mobile, uji staging multi-koneksi dan beban, batas koneksi/rate pada infrastruktur, kebijakan retensi/pemindaian bukti, serta autentikasi produksi. Login demo/password publik masih ada. Fitur ini tidak membuat aplikasi siap produksi dengan sendirinya.
