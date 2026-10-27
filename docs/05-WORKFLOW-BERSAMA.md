# Fondasi work item, assignment, handoff, dan presence

> Catatan historis increment 005. Formulir, detail, saldo dan retry SSE telah dilanjutkan pada increment 006. Lihat [status terbaru dan panduan pemasangan](06-VIDEO-EXPERIENCE.md). Pernyataan “belum dibangun” di bawah menggambarkan batas increment 005.

Scope increment ini: fondasi kolaborasi database untuk `feature/kantor-3d-review`. Login dan formulir penerimaan/penyaluran yang lama masih demonstrasi browser. Menyimpan formulir tersebut **belum** memanggil fungsi keuangan PostgreSQL dan tidak membuat tugas bersama. Jangan menyalin localStorage ke database sebagai transaksi sah.

## Audit awal dan keputusan

- Digunakan kembali: `pg` pool, sesi JWT, tabel `akun/unit/lembaga`, fungsi transaksi pada migrasi 003, kelima workstation, gateway Standar/3D, dan chat yang sudah ada.
- Sebelumnya simulasi: proyeksi antrean dari localStorage, saldo/formulir browser, login akun demo, dan petugas ilustrasi 3D.
- Dibangun: tabel work item/assignment/handoff/event, sinkronisasi melalui trigger transaksi, pemeriksaan identitas/unit dari database, API assignment, heartbeat presence, dan SSE snapshot.
- Diperbaiki: sumber tugas bersama tidak lagi localStorage. Kedua mode memakai komponen antrean, kebijakan, dan API yang sama. Saldo browser tetap diberi label simulasi.
- Belum dibangun: migrasi seluruh formulir ke backend, approval keuangan melalui UI database, penautan langsung ke halaman detail record, objek 3D individual per dokumen, animasi handoff, realtime chat baru, login produksi, dan deployment.

## Alur dan kebijakan

| Sumber yang benar-benar tersimpan                         | Tahap tugas                      | Aturan                                                                              |
| --------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| Penerimaan tercatat                                       | Catatan / completed              | Sudah dicatat; tidak menambah saksi atau approval baru                              |
| Penyaluran menunggu dua saksi                             | Saksi / open                     | Amil aktif, bukan pembuat, unit berbeda dari pembuat dan semua saksi sebelumnya     |
| Kesaksian pertama tersimpan                               | Saksi / open, assignment dilepas | Saksi kedua harus akun/unit lain; versi berubah meski status sumber tetap sama      |
| Dikonfirmasi                                              | Persetujuan / open               | Penyetuju independen dari pembuat dan seluruh saksi, termasuk unit                  |
| Menunggu konfirmasi mustahik atau status legacy disetujui | Penyaluran / open                | Pembuat menangani tindak lanjut; assignment tidak membuktikan penerimaan/penyaluran |
| Tersalurkan                                               | Catatan / completed              | Hanya mengikuti status sah dari domain                                              |
| Ditolak / dibatalkan / kedaluwarsa                        | Catatan / cancelled              | Tidak ditampilkan sebagai penyaluran berhasil                                       |

Claim hanya untuk tugas tanpa pemilik dan petugas yang memenuhi syarat. Handoff hanya oleh pemilik kepada petugas aktif yang memenuhi syarat di lembaga sama; alasan wajib. Release hanya oleh pemilik. Tidak ada endpoint yang menerima perubahan stage atau status keuangan bebas. Penugasan tidak menggantikan kewenangan domain atau mengunci orang lain keluar dari fungsi transaksi lama.

Pengecualian pemulihan: bila pemilik sebelumnya sudah nonaktif, berpindah lembaga, atau tidak lagi memenuhi aturan peran/unit, petugas lain yang memenuhi syarat dapat mengambil tugas itu. Versi, lock dan idempotency tetap berlaku; assignment lama ditutup dan alasan pemulihan dicatat. Kepemilikan yang masih sah tidak dapat direbut. Tenggat konfirmasi hanya membatasi pekerjaan sebelum konfirmasi; tugas yang sudah dikonfirmasi tetap dapat diambil penyetuju setelah tenggat itu, sesuai fungsi domain lama.

Contoh Desa A: draf sah yang dibuat melalui `buat_draf_penyaluran` otomatis menghasilkan antrean Saksi. Saksi 1 mengambil tugas dan dapat menyerahkannya kepada saksi lain yang memenuhi syarat. Ketika `konfirmasi_saksi` berhasil, trigger melepaskan assignment dan memperbarui versi. Setelah dua saksi menerima, tugas berpindah ke Persetujuan. `setujui_penyaluran` yang sah mengubah sumber menjadi tersalurkan; tugas mengikuti sebagai completed. Penolakan menjadi cancelled dan pelepasan saldo tetap dilakukan fungsi keuangan lama. Koreksi setelah penolakan membutuhkan draf baru sesuai domain; tidak ada tombol membuka ulang terminal.

## Penyimpanan dan konkurensi

`work_items` unik per lembaga/jenis/ID sumber. Trigger dan event ikut transaksi sumber: rollback sumber juga membatalkan tugas. Backfill migrasi hanya membaca transaksi PostgreSQL yang sudah tersimpan. Work item tidak menyalin saldo, nominal, atau data muzakki; snapshot membaca nominal dari tabel sumber.

`work_assignments` menyimpan interval kepemilikan, dengan indeks unik satu assignment aktif. `work_handoffs` dan `work_events` append-only secara operasional; bukan pengganti `audit_log` kriptografi. Trigger perubahan sumber menutup assignment lama. Assignment memeriksa versi, memakai row lock, dan mengambil lock sumber sebelum work item. ID request unik per aktor/lembaga; retry identik mengembalikan snapshot hasil sebelumnya, payload berbeda mendapat 409. Maksimal 30 mutation tersimpan per akun per menit. Respons hilang perlu retry dengan ID sama; frontend mempertahankan ID untuk input identik.

## API dan keamanan

- `GET /api/office/work-items`: snapshot maksimal 200 record, proses aktif didahulukan; bukan total tanpa batas.
- `GET /api/office/work-items?history=<uuid>`: maksimal 50 event tugas dalam lembaga sama.
- `POST /api/office/work-items`: `{itemId,version,requestId,action,targetUserId?,reason?}`; action `claim/handoff/release`.
- `POST /api/office/presence`: `{sessionId,station}`; station null atau salah satu workstation.
- `DELETE /api/office/presence`: menghapus sesi milik aktor sendiri.
- `GET /api/office/stream`: SSE event `snapshot` dan `unavailable`.

Semua endpoint baru memvalidasi JWT dan mengambil identitas/peran/unit aktif dari database, bukan nama atau unit legacy dalam cookie. Setiap query dibatasi lembaga. Mutasi memeriksa Origin terhadap `APP_URL`, menerima JSON maksimal 8192 byte, dan memvalidasi UUID. Tabel/fungsi baru tidak boleh diakses langsung role Supabase `anon/authenticated` atau PUBLIC; koneksi backend membutuhkan owner/BYPASSRLS yang sesuai. Tidak ada service key di browser.

Login demo dengan password publik masih ada. `OFFICE_WORKFLOW_DEMO_ACK=true` adalah pengakuan pengujian, bukan peningkatan keamanan login. Jangan menyebut konfigurasi ini siap produksi. SSE memeriksa ulang akun aktif serta waktu kedaluwarsa JWT setiap snapshot; repo belum mempunyai revokasi sesi server terpusat.

## Realtime dan presence

SSE dipilih karena browser hanya perlu menerima pembaruan. WebSocket memerlukan infrastruktur koneksi dua arah; provider terkelola menambah dependensi layanan. SSE membaca snapshot PostgreSQL setiap 3 detik, sehingga beberapa instance tidak bergantung pada event emitter dalam memori. Koneksi dibatasi 25 detik lalu EventSource reconnect; snapshot penuh menggantikan state lama tanpa kehilangan delta. Trade-off: near realtime dengan latensi sekitar 3 detik dan query periodik, bukan push instan dari broker.

Heartbeat tiap 20 detik, TTL 60 detik menurut jam database. Setiap tab memakai session UUID sendiri; maksimum empat sesi aktif per akun, tampilan menggabungkan akun berdasarkan heartbeat terbaru. Cleanup kedaluwarsa dibatasi akun saat heartbeat; query selalu menyaring TTL. Saat hidden/pagehide, frontend mencoba menghapus sesi dan menutup stream; kegagalan jaringan diselesaikan TTL. Saat offline/reconnect, daftar tidak mengklaim pengguna tetap online. Koneksi SSE yang batal membersihkan timer; kegagalan izin menutup stream tanpa membeberkan detail internal.

Hosting/proxy harus mendukung streaming setidaknya 25 detik dan tidak melakukan buffering SSE. Endpoint stream tetap membutuhkan pembatasan koneksi/rate limit pada infrastruktur sebelum rilis publik. Belum ada uji beban atau benchmark multi-instance.

Batas reconnect saat ini: putus jaringan dan penutupan normal stream ditangani EventSource otomatis. Event `unavailable` dari server menutup stream dan menyediakan tombol **Hubungkan ulang**; gangguan database pada jalur ini masih dapat memerlukan tindakan manual. Retry otomatis untuk kasus tersebut ditunda.

## Aktivasi pada database uji

1. Pastikan migrasi `001_initial_schema.sql` dan `003_stored_procedures.sql` sudah terpasang. Seed 002 hanya untuk database demo baru, jangan diputar ulang pada database berisi data.
2. Jalankan `db/migrations/005_office_workflow.sql` sekali lewat SQL editor atau `psql -v ON_ERROR_STOP=1 -f db/migrations/005_office_workflow.sql`. Migrasi 004 hanya diperlukan untuk chat yang terpisah. Runner lama `npm run db:migrate` masih menjalankan 001–003; jangan memakainya untuk update ini.
3. Atur koneksi database backend yang sudah ada, `JWT_SECRET` acak minimal 32 karakter, dan `APP_URL` tepat sama dengan origin browser.
4. Atur `OFFICE_WORKFLOW_ENABLED=true` serta `OFFICE_WORKFLOW_DEMO_ACK=true` untuk lingkungan pengujian yang disadari memakai login demo.
5. Akun/lembaga/unit sesi harus ada dan aktif di database. Unit legacy cookie tidak dijadikan kewenangan.
6. Buat transaksi melalui fungsi domain database dalam lingkungan uji. Antrean kosong adalah hasil yang benar jika belum ada sumber tersimpan.

Fitur default nonaktif dan menampilkan pemberitahuan konfigurasi. Kegagalan database tidak diganti tugas palsu/localStorage. Untuk rollback aplikasi, nonaktifkan flag lebih dulu; simpan tabel/history. Menghapus trigger/tabel membutuhkan backup dan tinjauan DBA, bukan bagian rollback otomatis. Migrasi 005 bersifat sekali jalan dan membungkus perubahan dalam satu transaksi.

## Verifikasi

`npm run test:office` mencakup kebijakan, trigger, fungsi transaksi asli, assignment, handoff, stale version, idempotency, tenant, TTL, rollback, reader JSON dan lifecycle stream. Integrasi SQL memakai PostgreSQL WASM PGlite + pgcrypto; simulasi request bersaing diserialisasi PGlite sehingga belum membuktikan lock/deadlock antar koneksi PostgreSQL native. Jalankan pengujian multi-koneksi pada database staging sebelum produksi.
