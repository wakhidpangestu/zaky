# Zaky — adaptasi video Nadi

Pengguna sudah memilih **Tetap Zaky**: mengikuti tampilan 3D, animasi scroll, perpindahan ruangan, dan formulir bertahap; isi serta proses tetap pengelolaan zakat. Instruksi sebelumnya tetap berlaku: update/push hanya `feature/kantor-3d-review`.

## Bukti visual dan pemetaan

| Waktu video | Referensi yang terlihat                                                                                                  | Implementasi Zaky                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00–04       | Navbar kapsul, judul di kiri, gedung isometrik di kanan, pencarian, indikator tahap bawah                                | Identitas Zaky; verifikasi kode; gedung layanan zakat; indikator perjalanan                                                                                |
| 05–28       | Kamera bergerak dari luar ke resepsionis/poli/lab/farmasi/kasir; satu karakter mengikuti jalur oranye; kartu kontekstual | Penerimaan, penyaluran, dua saksi, persetujuan, catatan. Status ilustrasi tidak dinyatakan sebagai transaksi nyata                                         |
| 29–32       | Peta ambulans dan timeline                                                                                               | Pelacakan tahapan transaksi berdasarkan kode; tanpa kendaraan/GPS/ETA fiktif                                                                               |
| 33–36       | Kartu layanan dengan ilustrasi                                                                                           | Alat penerimaan, penyaluran, pemeriksaan dan verifikasi yang dapat dibuka                                                                                  |
| 36–39       | Direktori dokter dengan filter                                                                                           | Direktori peran Zaky dengan filter; akun tim nyata di workspace, tanpa dokter/rating/sertifikat fiktif                                                     |
| 39–60       | Modal dengan panel kiri gelap, lima tahap, pilihan layanan, detail, review, e-ticket, cetak/kalender                     | Wizard pencatatan lima tahap dan bukti transaksi; receipt dibuat backend. Tidak ada pembayaran otomatis atau klik 'sudah bayar' yang menyatakan uang masuk |
| 61–64       | Preview aplikasi telepon                                                                                                 | Preview antrean kerja dan tautan mode standar/3D web; tanpa klaim aplikasi App Store yang tidak ada                                                        |
| 65–69       | Tiga kartu paket dan komparasi                                                                                           | Pilihan cara kerja Standar/3D/Verifikasi, dengan perbandingan fitur; tanpa paket harga zakat atau biaya rekaan                                             |
| 69–75       | Kartu kepercayaan, mitra, CTA gedung/jalan                                                                               | Penjelasan mekanisme pemeriksaan dan tautan dokumentasi; tanpa testimoni, mitra, statistik penggunaan fiktif                                               |

## Arsitektur dan keputusan

Tampilan video diterjemahkan ke komponen web dan Three.js native. Scene lama 2.600+ baris, kartu klaim sintetis dan modal kuitansi acak tidak dijadikan sumber kebenaran. Scene baru dibagi menjadi pembangun model, matematika kamera, renderer, dan UI. Mode Standar tetap berfungsi tanpa WebGL; 3D dimuat secara lazy. Warna krem, tipografi hitam, aksen oranye dan layout mengikuti video, dengan nama/alur Zaky.

Backend menggunakan tabel/fungsi domain lama dan migrasi workflow 005. Migrasi aditif 006 menyediakan penyimpanan bukti privat dan idempotency operasi. API baru mengambil akun/peran/unit/lembaga dari server, memakai JSON berbatas, origin, validasi angka desimal, transaksi dan lock sesuai urutan keuangan. Tidak ada operasi bebas mengganti status/saldo, approval oleh maker, atau tenant silang.

Wizard reusable dibuka dari landing dan workstation, memakai formulir yang sama di halaman penuh; tanpa iframe. Guest dapat membaca alur, tetapi harus login untuk menyimpan. Penerimaan memanggil `catat_penerimaan`; penyaluran memanggil `buat_draf_penyaluran` dengan bukti yang benar-benar diunggah; saksi/persetujuan/pembatalan memanggil fungsi yang sudah ada. Hasil sukses hanya setelah commit backend; retry tidak boleh menggandakan keuangan. Detail record memakai ID tepat, bukan menyuruh pengguna mencari di daftar simulasi.

Bukti digital berisi kode/status nyata dan QR/tautan menuju record yang dilindungi sesi. Cetak memakai browser print-to-PDF dan kalender memakai berkas ICS untuk tenggat tindak lanjut; tidak mengirim email/WhatsApp atau menjadwalkan layanan eksternal. Tautan mustahik hanya berasal dari token backend, bukan kode demo.

## Aksesibilitas, lifecycle, dan batas

Dialog native dengan judul, focus trap, Escape, validasi tiap tahap dan perlindungan isian. Layout mobile, keyboard, prefer-reduced-motion, WebGL gagal/context loss, halaman hidden dan disposal resource harus diuji. Render tidak berjalan terus ketika diam. Scroll tidak ditangkap saat dialog/input aktif. Reconnect memuat snapshot lagi, termasuk gangguan SSE sementara.

Fitur database membutuhkan migrasi dan konfigurasi yang benar; jangan menggantinya diam-diam dengan localStorage. Tidak ada migrasi/deployment produksi dalam tugas ini. Akun demo adalah akun pengujian, bukan autentikasi produksi. Uji nyata multi-koneksi PostgreSQL/hosting tetap diperlukan sebelum rilis publik.
