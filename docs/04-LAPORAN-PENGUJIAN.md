# Laporan pengujian workflow bersama

Branch: `feature/kantor-3d-review`. Basis increment: `77c0345946a99f794b080b1c810b902112ff5138`. Pengujian memakai database dan server lokal sementara, bukan deployment atau database produksi.

| Pemeriksaan | Perintah / metode | Hasil |
|---|---|---|
| Instalasi | `npm ci --ignore-scripts --no-audit --no-fund` dan penambahan dev dependency PGlite | Berhasil; lockfile hanya menambah dependency pengujian |
| Suite existing | `npm run test:all` | Exit 0; domain, kripto, urutan penguncian, serangan, jaringan dan simulasi reservasi saldo |
| Suite office | `npm run test:office` | 55 pass, 0 fail, 0 skip |
| TypeScript penuh | `npx tsc --noEmit` | Exit 0 |
| ESLint file baru/diubah pada increment | `npx eslint` terhadap workflow, API baru, hook/queue/presence, tampilan office/standard dan tes baru | Exit 0, tanpa error/warning |
| ESLint seluruh repo | `npm run lint` | Masih gagal: 86 error dan 167 warning lama. Baseline sebelum increment: 87 error dan 167 warning |
| Production Next.js | `npm run build` | Exit 0 dengan Next.js 16.4.3, Cache Components dan Partial Prefetching tetap aktif; tiga route baru terdaftar dynamic |
| Pemeriksaan diff | `git diff --check` | Bersih |

## Integrasi SQL yang benar-benar dijalankan

Node test runner menjalankan PGlite (mesin PostgreSQL WASM) dengan ekstensi pgcrypto dan migrasi 001, 002, 003, 005. Tes memanggil fungsi transaksi asli, bukan menirukan output SQL.

Diuji: pembuatan tugas dari draf tersimpan, receipt tercatat tanpa saksi baru, kegagalan saldo, rollback transaksi sumber, claim/handoff/release beserta histori, penolakan maker/unit/peran/tenant/akun nonaktif, stale version, request identik, request ID dengan body berbeda, satu assignment aktif, kesaksian pertama, dua saksi ke penyetuju, approval final dan invariant saldo, larangan terminal diubah, histori append-only, expiry konfirmasi, approval setelah tenggat konfirmasi, pemulihan owner nonaktif/berpindah lembaga, session presence milik akun lain, dan TTL memakai jam database.

Tes request bersaing diserialisasi PGlite: hasil satu sukses dan satu konflik versi telah diuji, tetapi lock/deadlock pada dua koneksi PostgreSQL native belum dibuktikan. Pengujian itu tetap diperlukan di staging.

## HTTP dan browser nyata

Harness lokal menjalankan Next.js dan database PGlite melalui adapter protokol PostgreSQL. Permintaan menggunakan beberapa JWT/sesi berbeda; identitas tampilan/peran/unit dalam cookie sengaja berbeda dari database untuk memastikan server mengambil kewenangan dari database.

HTTP berhasil: snapshot dengan identitas database, penolakan Origin asing, penolakan maker, claim, replay, konflik 409, kepemilikan persisten, satu event claim, presence terlihat oleh sesi lain, SSE terautentikasi, dan anonim mendapat 401.

Chromium headless melalui Playwright berhasil menjalankan dua browser context terpisah: Standar menyerahkan tugas kepada petugas lain; perubahan terlihat di sesi 3D melalui SSE; panel Tim menampilkan heartbeat nyata; offline menghapus kepastian status online; reconnect memuat snapshot lagi; perpindahan 3D ke Standar mempertahankan antrean. Tidak ada `pageerror` selama skenario tersebut. Screenshot kedua mode diperiksa. Ada warning Three.js lama tentang PCFSoftShadowMap; tidak diubah dalam scope ini.

Pengunduh browser bawaan lingkungan gagal; pengujian akhirnya memakai binary Chromium sementara dari paket npm dan keluar dengan status 0. Harness browser adalah pengujian lokal tambahan; perintah regresi yang disimpan dalam repo adalah `npm run test:office`.

## Review dan perbaikan

Review independen menemukan dua masalah penting: tenggat konfirmasi terlalu membatasi tahap approval, dan owner nonaktif membuat assignment macet. Keduanya direproduksi dengan tes gagal terlebih dahulu, diperbaiki, lalu suite office menjadi 55/55. Pemulihan tetap memeriksa versi, lembaga, peran/unit dan histori; owner yang masih sah tidak dapat direbut. Temuan presence saat akun pindah lembaga juga ditutup dengan tes regresi dan pembaruan tenant heartbeat.

Minor yang ditunda: event server SSE `unavailable` dapat membutuhkan tombol **Hubungkan ulang** meski layanan database sudah pulih. Putus jaringan biasa dan rotasi koneksi normal tetap memakai reconnect EventSource. Batas tersebut tercatat dalam panduan integrasi.

## Batas rilis

- Login masih publik/demo; secret kuat dan flag pengakuan demo tidak menggantikan autentikasi produksi.
- Formulir/saldo browser lama belum dimigrasikan ke backend. Transaksi simulasi tidak membentuk work item PostgreSQL.
- Chat lama tetap terpisah dan membutuhkan konfigurasi 004; tidak diberi realtime transport baru dalam increment ini.
- Belum ada objek task individual/animasi handoff 3D atau halaman detail backend; pengguna menemukan kode pada alat kerja yang sudah ada.
- Belum diuji: hosting produksi, multi-instance, beban SSE, perangkat mobile nyata, dan native PostgreSQL concurrency/RLS dengan semua role deployment.
- Tidak menjalankan migrasi produksi, deployment, merge, atau push ke main. Migrasi dan aktivasi pengujian dijelaskan di [05-WORKFLOW-BERSAMA.md](05-WORKFLOW-BERSAMA.md).
