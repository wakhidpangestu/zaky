# Integrasi dan verifikasi kantor 3D

## Pembaruan arsitektur workflow

Antrean kantor sekarang bersumber dari `work_items` PostgreSQL melalui API bersama, bukan proyeksi localStorage. Migrasi aditif 005 menghubungkan sumber domain dan task melalui trigger transaksional. Assignment/handoff memakai versi, idempotency, dan histori; presence memakai heartbeat 20 detik/TTL 60 detik, dan SSE snapshot tiap 3 detik dengan reconnect. Panduan integrasi, batas hosting, keamanan login demo, migrasi sekali jalan dan rollback ada di [05-WORKFLOW-BERSAMA.md](05-WORKFLOW-BERSAMA.md). Keterangan prototipe di bawah adalah catatan fase sebelumnya.

## 1. Pemeriksaan sebelum integrasi

Pastikan checkout adalah repository Zaky yang benar dan basis target telah ditinjau. Bila empat file yang diganti sudah berubah setelah cf097bd, gabungkan perubahan secara manual; jangan menyalin tanpa membaca diff. Pertahankan konfigurasi framework, dependency versions, lockfile, dan file env repository.

Paket bukan aplikasi mandiri. Import berikut berasal dari repository: `@/lib/auth`, `@/lib/db`, `@/lib/store`, `@/lib/format`, `@/components/dashboard-shell`. File source lain yang dibuka di iframe juga harus tetap tersedia.

## 2. Peta implementasi

| File | Tanggung jawab |
| --- | --- |
| `model.ts` | Types, meja, assignment visual, proyeksi status, validasi chat dan origin. |
| `use-office-data.ts` | Pembacaan store dan pemutakhiran lokal; tidak menulis transaksi. |
| `gateway.tsx` | Pilihan mode, preferensi, dynamic import, error boundary. |
| `standard-view.tsx` | Saldo, antrean dan akses alat tanpa import scene. |
| `scene.tsx` | Geometri kantor, picking, orbit, zoom, avatar lokal, cleanup. |
| `office-view.tsx` | Menyatukan scene, task, tools dan team. |
| `work-panel.tsx` | Dialog form same-origin dengan peringatan sebelum menutup. |
| `work-layout.tsx` | Menyembunyikan shell berulang hanya pada frame same-origin. |
| `team-chat.tsx` | UI chat polling; retry dan idempotency key. |
| `api/office/chat/route.ts` | Auth, tenant, origin, batas input, rate limit dan penyimpanan pesan. |
| `004_office_chat.sql` | Tabel pesan opsional, indeks, RLS dan pembatasan akses klien langsung. |

## 3. Uji cepat tampilan

1. Login pada akun demo. Sebelum memilih mode, kedua opsi tersedia.
2. Pilih standar; cek Network browser. Scene kantor/Three.js tidak boleh dimuat oleh komponen kantor sebelum pengguna memilih 3D. Aset 3D lain dari halaman landing bukan bagian klaim ini.
3. Pilih kantor 3D; klik setiap meja dan coba alternatif tombol dengan Tab/Enter.
4. Putar dan zoom; reset; fullscreen; resize ke 360/768/1440 px. Cek label tidak menutup seluruh scene.
5. Buka form; simpan record dummy; tutup panel; pastikan data segar. Jangan isi data pribadi nyata.
6. Coba tutup form belum disimpan. Peringatan bukan autosave; menutup tetap dapat kehilangan isian.
7. Coba navigasi form menuju dashboard: frame tidak boleh menampilkan kantor 3D bersarang.
8. Uji WebGL disabled/context loss; daftar meja dan mode standar tetap tersedia.
9. Aktifkan reduced-motion; avatar tidak harus dianimasikan. Uji keyboard, zoom teks, fokus dialog, Escape.

## 4. Uji task dan role

Buat fixture setiap status yang ada. Hanya `tersalurkan` merupakan `done=true`. Ditolak, dibatalkan dan kedaluwarsa terminal tetapi bukan sukses. `disetujui` tidak boleh dipromosikan otomatis ke `tersalurkan` oleh adapter.

Untuk witness, pembuat dan unit pembuat tidak boleh menerima assignment. Saksi yang sudah tercatat dan unitnya tidak boleh mengisi saksi berikutnya. Penyetuju harus role penyetuju dan independen dari pembuat/saksi. Unknown unit tidak ditebak. Pengujian ini menguji tampilan; produksi tetap membutuhkan pemeriksaan server pada mutasi.

Tugas dibuka pada daftar yang tersedia; pengguna mencari kode record. Paket belum menambah deep link yang memfokuskan record tertentu, mekanisme claim, lease, atau delegasi task.

## 5. Aktivasi chat di database uji

Jangan jalankan langkah ini pada produksi dengan akun demo. `OFFICE_CHAT_DEMO_ACK=true` hanya mengakui batasan demo, bukan meningkatkan keamanan login.

Prasyarat: database uji memakai migrasi dasar repository dan akun seed yang cocok dengan ID sesi. Siapkan secret acak kuat di server, origin APP_URL, dan koneksi DATABASE_URL. Jangan membagikan .env atau memasukkan secret ke commit.

Setelah membaca SQL dan memverifikasi target database uji:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/004_office_chat.sql
```

Penggunaan `IF NOT EXISTS` tidak menyelaraskan skema tabel lama yang berbeda. Periksa schema sebelum memakai nama tabel yang sama. Migration tidak menambahkan policy browser permissive. Koneksi API saat ini mengharapkan role server yang dapat mengakses tabel dengan RLS, biasanya owner/BYPASSRLS. Evaluasi hak minimum dan otorisasi sebelum produksi; jangan membuka tabel ke anon untuk menghilangkan error.

Variabel:

```text
APP_URL=<origin lingkungan uji, misalnya http://localhost:3000>
DATABASE_URL=<connection string database uji; server only>
JWT_SECRET=<nilai acak kuat, minimal 32 karakter; server only>
OFFICE_CHAT_ENABLED=true
OFFICE_CHAT_DEMO_ACK=true
```

Setelah secret berubah, login ulang. Verifikasi GET tanpa sesi menghasilkan penolakan, bukan daftar pesan. Akun/lembaga nonaktif juga harus ditolak. POST origin salah/missing ditolak. Uji pesan kosong, >1.000 karakter, body >8 KB, JSON rusak, dan ID pesan tidak valid.

Uji ulang POST dengan clientId sama: tidak boleh menambah pesan kedua. clientId sama dengan teks berbeda harus ditolak. Uji 21 pesan dalam jendela 60 detik. Uji dua akun pada browser terpisah: chat seharusnya terbaca melalui polling setelah konfigurasi; data transaksi keuangan tetap tidak ikut sinkron.

Batas: GET tidak punya distributed rate-limit tambahan; tidak ada pagination history, moderasi, penghapusan pesan, retensi otomatis, presence, DM, atau notifikasi push. Sebelum produksi, tinjau seluruhnya sesuai kebutuhan.

## 6. Gap penting sebelum produksi

- Auth repository masih kredensial demo publik; perlu autentikasi akun nyata dan lifecycle sesi.
- Form finansial existing memakai localStorage/hard-coded actor; seluruh mutasi harus dipindahkan ke API server terotorisasi dan transaksi SQL.
- Nama/unit demo tidak boleh menjadi identifier kewenangan produksi. Selaraskan unit session `u...` dengan ID DB `a...`.
- Store browser tidak per lembaga, tidak menjamin isolasi, tidak aman dari manipulasi, dan helper lama dapat fallback ke seed ketika JSON rusak.
- Belum ada task durable lintas perangkat, claim/lock pekerjaan, kontrol versi atau event realtime transaksi.
- Tahap verifikasi penerimaan dan pencatat terpisah pada rancangan T01-T09 membutuhkan workflow domain baru.
- Integrasi iframe perlu dicek terhadap header CSP/anti-framing deployment. Jangan mengendurkan keamanan lintas origin; sediakan halaman penuh bila embedding tidak didukung.
- Tidak ada pengujian perangkat nyata, accessibility audit otomatis, benchmark GPU, migrasi ulang, atau audit keamanan independen pada paket ini.

## 7. Rollback non-destruktif

Matikan chat dengan flag. Kembalikan empat entry/layout existing dari version control melalui review. Lepaskan modul office yang tidak dipakai. Jangan DROP tabel pesan saat rollback biasa; simpan cadangan dan kebijakan retensi sebelum pembersihan. Ledger finansial tidak diubah oleh migration kantor.

## 8. Branch review

Penyerahan memakai `feature/kantor-3d-review`, berdasarkan `feature/gamifikasi-edukasi-zaky` pada `cf097bdc0022b7180fbeede916332a9f7ab173fc`. Main dan branch gamifikasi lama tidak menjadi target penulisan. Branch ini bukan integrasi dengan main terbaru; periksa perubahan kolaborator sebelum merge kelak. Tidak ada skrip auto-push/auto-deploy atau migrasi otomatis disertakan. Status produksi tidak disimpulkan dari tersedianya source pada branch.
