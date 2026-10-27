# Peran, meja, dan pemisahan kewenangan

## Status implementasi alur bersama

Implementasi tahap ini mengikuti fungsi domain SQL yang sudah ada. Penerimaan yang tersimpan tidak diberi saksi tambahan; assignment tidak menjalankan persetujuan atau pemindahan dana. Kesaksian pertama melepaskan assignment untuk saksi independen berikutnya. Detail state, aturan handoff, rejection, concurrency, history, dan contoh Desa A ada pada [05-WORKFLOW-BERSAMA.md](05-WORKFLOW-BERSAMA.md). Alur visi di bawah belum seluruhnya dapat dijalankan dari formulir browser lama.

*FLOW / 05 | 26 Oktober 2026*

Muzakki adalah pemberi zakat; mustahik adalah penerima zakat. Keduanya tidak boleh tertukar ketika mencatat. Nama meja menggambarkan fungsi kerja, bukan otomatis menambah role baru ke database.

| Fungsi kerja | Role yang tersedia | Tugas dan batas |
| --- | --- | --- |
| Amil penerimaan | amil | Mencatat zakat masuk. Tidak otomatis menjadi saksi atau penyetuju penyaluran sendiri. |
| Amil penyalur | amil | Menyiapkan draf, tujuan, penerima, nominal, dan bukti. Dana dicadangkan menurut proses asli. |
| Saksi 1 dan 2 | amil lintas unit | Memeriksa penerimaan pada metode saksi. Akun dan unit harus memenuhi independensi. |
| Penyetuju | penyetuju | Meninjau penyaluran setelah konfirmasi lengkap, bukan membuat konfirmasi atas nama penerima. |
| Pencatat / pemeriksa | Fungsi pencatatan; bukan role baru | Mencatat melalui formulir asli dan melihat riwayat. Tidak memasukkan ulang nominal untuk menutup tugas. |
| Mustahik | Penerima konfirmasi | Pada metode mustahik, memberi keputusan melalui mekanisme asli. Tidak perlu masuk kantor 3D. |
| Administrator | admin | Menyiapkan sistem; tidak diberi jalan pintas untuk menyetujui penyaluran lewat scene. |

## Aturan penugasan pada tampilan

Tugas saksi hanya ditawarkan kepada amil yang bukan pembuat, belum menjadi saksi pada record itu, dan unitnya tidak sama dengan pembuat maupun saksi yang sudah tercatat. Tugas persetujuan hanya ditawarkan kepada penyetuju independen dari pihak sebelumnya. Jika unit tidak dikenali, filter Tugas saya tidak menebak kewenangannya.

## Akun demo untuk skenario uji

Budi: Pelayanan; Hari: Keuangan; Dewi: Penyaluran; Rian: Pengawasan. Pemetaan ini mengikuti nama unit pada seed SQL. Auth demo menggunakan ID unit berawalan u, sedangkan seed database menggunakan a; helper lama juga memiliki pemetaan yang tidak konsisten. Pemetaan visual bukan penyelesaian migrasi identitas ini.

> Identitas pada data demo masih berupa nama dan label unit. Produksi wajib memakai ID akun/unit dari server serta mengecek aturan lagi pada setiap aksi, bukan mempercayai filter atau tombol yang dinonaktifkan.

# Flow penerimaan dan pencatatan awal

*FLOW / 06 | 26 Oktober 2026*

## Alur yang tersedia melalui form lama

> Muzakki menyerahkan informasi > Amil membuka Meja Penerimaan > Isi dan periksa form > Simpan penerimaan > Catatan dan pos dana diperbarui > Riwayat tersedia.

| Tahap | Pemilik / masukan | Hasil dan kontrol |
| --- | --- | --- |
| R1. Persiapan | Amil; identitas muzakki atau anonim, pos, kanal, bruto | Periksa kelengkapan, tujuan pos, dan nominal sebelum simpan. |
| R2. Pencatatan | Amil; formulir /penerimaan/buat | Gunakan proses pencatatan asli. Scene tidak menerima nominal untuk ditambahkan sendiri. |
| R3. Pembaruan | Proses aplikasi asli; penerimaan tersimpan | Riwayat penerimaan dan angka pos mengikuti sumber data yang sama. |
| R4. Pemeriksaan | Pencatat sebagai fungsi kerja | Cari kode penerimaan, periksa hasil, lalu koordinasikan koreksi melalui proses yang disetujui. |
| R5. Kesiapan alokasi | Amil penyalur; saldo tersedia | Draf penyaluran adalah record berbeda. Jangan menyamakan penerimaan dengan dana sudah disalurkan. |

## Yang belum boleh digambarkan sebagai sudah berjalan

Repository saat ini tidak memiliki pipeline penerimaan terpisah berupa input > saksi memeriksa > pencatat membukukan. Paket ini tidak memalsukan tiga tahapan tersebut dengan animasi atau notifikasi. Meja Penerimaan menampilkan jumlah catatan yang ada, bukan antrean penerimaan belum diverifikasi.

## Target berikutnya sesuai permintaan pengguna

Tambahkan receipt_draft, receipt_review, dan receipt_posting sebelum dana dianggap masuk. Saksi memeriksa dokumen; pencatat atau service yang berwenang membukukan tepat sekali setelah lolos. Ini membutuhkan skema dan API baru, penentuan siapa berwenang mengoreksi, serta pengujian transaksi atomik.

## Contoh operasional

Seorang muzakki menyerahkan Rp1.000.000. Amil memasukkan data melalui meja penerimaan dan memeriksa perhitungan hak amil pada formulir yang sudah ada. Setelah tersimpan, pencatat melihat kode dan riwayatnya, bukan memasukkan Rp1.000.000 lagi. Tugas penyaluran dibuat terpisah dari saldo tersedia sesuai kebijakan lembaga.

> Contoh nominal hanya ilustrasi alur aplikasi, bukan petunjuk perhitungan zakat atau hak amil. Mode 3D tidak mengambil keputusan keagamaan atau memproses pembayaran.

# Flow penyaluran sampai selesai

*FLOW / 07 | 26 Oktober 2026*

> Draf + reservasi > Konfirmasi mustahik ATAU dua saksi > Persetujuan independen > Tercatat tersalurkan > Riwayat dan pemeriksaan.

| Tahap | Pelaku dan pekerjaan | Syarat perpindahan |
| --- | --- | --- |
| D1. Buat draf | Amil penyalur memilih pos, mustahik, nominal, dan metode konfirmasi. | Record dibuat melalui formulir asli; reserve sesuai implementasi prosesnya. |
| D2. Konfirmasi | Mustahik menggunakan mekanisme asli; alternatifnya dua saksi dari akun/unit yang memenuhi syarat. | Belum lengkap berarti tetap menunggu. Chat atau klik meja bukan konfirmasi. |
| D3. Pemeriksaan | Saksi memeriksa kejadian dan bukti, bukan hanya status di layar. | Saksi tidak boleh menjadi pembuat atau mengulang tanda tangan. |
| D4. Persetujuan | Penyetuju membuka daftar persetujuan untuk record terkonfirmasi. | Peran dan independensi diperiksa oleh proses server yang diperlukan; UI baru hanya memfilter. |
| D5. Penutupan | Proses asli mengubah status menjadi tersalurkan dan membukukan. | Status final dibaca dari sumber data, tidak dipicu oleh avatar atau tombol task. |
| D6. Riwayat | Pencatat/pemeriksa melihat record dan alat verifikasi. | Tidak menulis penerimaan atau penyaluran kedua untuk menandai pekerjaan selesai. |

## Contoh tujuan Desa A

Buat record penyaluran untuk mustahik di Desa A melalui form asli. Versi sekarang menyimpan tujuan sebagai kabupaten pada data existing; ini belum menjadi modul desa atau pengiriman logistik. Setelah konfirmasi dan persetujuan sesuai proses, tugas pindah ke Layar Catatan. Tidak ada klaim bahwa uang benar-benar sampai hanya karena status visual berubah.

## Cabang yang tidak berakhir sukses

Penerima menolak, draf dibatalkan, atau masa berlaku habis: proses berakhir tanpa label selesai tersalurkan. Pelepasan reservasi harus dilakukan oleh proses transaksi asli, bukan adapter scene. Data dengan status tidak dikenal ditolak oleh proyeksi dan dilaporkan sebagai data yang perlu diperiksa.

> Pada jalur mustahik, saksi tambahan tidak diwajibkan oleh model yang sekarang. Pada jalur saksi, persetujuan baru setelah konfirmasi yang cukup. Jangan menggabungkan kedua jalur menjadi kewajiban ganda tanpa perubahan aturan resmi.

# Task pipeline dan aturan antrean

*FLOW / 08 | 26 Oktober 2026*

Satu record penyaluran menghasilkan satu kartu tugas. Tidak ada salinan nominal atau tabel tugas finansial kedua. Meja penanganan dihitung dari metode dan status record.

| Status sumber | Meja / penanganan | Makna hasil |
| --- | --- | --- |
| dibuat | Saksi untuk metode saksi; Penyaluran untuk metode mustahik | Belum selesai; perlu proses lanjutan. |
| menunggu_konfirmasi | Saksi atau Penyaluran menurut metode | Menunggu pihak pengonfirmasi; bukan persetujuan. |
| dikonfirmasi | Persetujuan | Konfirmasi lengkap; antre penyetuju independen. |
| disetujui | Penyaluran | Status kompatibilitas lama; jangan otomatis menyatakan tersalurkan. |
| tersalurkan | Catatan | Selesai menurut status sumber; bukan pembuktian fisik penyerahan uang. |
| ditolak_penerima | Catatan | Terminal, tidak berhasil tersalurkan. |
| dibatalkan | Catatan | Terminal, bukan keberhasilan. |
| kedaluwarsa | Catatan | Terminal; tidak muncul sebagai tugas aktif. |

## Perpindahan kartu dan pemutakhiran

Adapter membaca perubahan event store, storage browser, fokus window, serta pembukaan/penutupan panel. Setelah record berubah, kartu dihitung ulang dan muncul di meja yang sesuai. Jika pengguna mengubah data di perangkat berbeda, perubahan transaksi belum tersinkron karena sumber finansial masih localStorage.

## Filter Tugas saya

Filter adalah bantuan navigasi. Untuk saksi dan penyetuju, kecocokan peran, nama, dan unit diperiksa secara konservatif. Record terminal tidak menjadi tugas aktif. Data ganda dengan ID sama hanya tampil sekali; jumlah negatif, kode tidak valid, metode tidak dikenal, dan status tidak dikenal tidak masuk antrean.

## Makna progress bar

Angka progress merupakan indeks tahap: dibuat 20, menunggu 40, dikonfirmasi 70, disetujui 85, tersalurkan 100. Ini tidak menyatakan persentase uang sampai, integritas lembaga, atau nilai kesalehan. Klaim tugas, SLA, delegasi, dan penguncian kerja antaruser belum tersedia.

# Pipeline kolaborasi lengkap yang dituju

*FLOW / 09 | 26 Oktober 2026*

> Bagian ini adalah rancangan lanjutan untuk memenuhi seluruh alur kolaborasi yang diminta. Tahap di bawah belum menjadi mesin workflow bersama dalam source MVP.

| ID / langkah | Pemilik | Masukan > keluaran |
| --- | --- | --- |
| T01. Registrasi penerimaan | Amil pelayanan | Informasi muzakki > receipt draft; belum menambah saldo. |
| T02. Verifikasi masuk | Saksi penerimaan independen | Draft + bukti > hasil pemeriksaan atau kembali untuk koreksi. |
| T03. Pembukuan masuk | Pencatat / service berwenang | Hasil lolos > penerimaan diposting tepat sekali dan saldo diperbarui. |
| T04. Rencana alokasi | Amil penyalur | Saldo + penerima + tujuan Desa A > draf dan reservasi dana. |
| T05. Pelaksanaan | Petugas penyalur | Draf yang memenuhi prasyarat > bukti penyerahan / laporan pelaksanaan. |
| T06. Konfirmasi keluar | Mustahik atau dua saksi | Penyerahan + bukti > konfirmasi sah sesuai metode. |
| T07. Persetujuan final | Penyetuju independen | Konfirmasi lengkap > keputusan, dengan actor dan waktu server. |
| T08. Pembukuan akhir | Service pencatatan | Keputusan sah > saldo dan audit dalam transaksi atomik. |
| T09. Penutupan | Pencatat / pemeriksa | Catatan akhir > closed; tidak mengulangi posting uang. |

## Kontrak task bersama yang diperlukan

Setiap task memiliki id, lembaga_id, entity_type, entity_id, step, status, assignee_id atau candidate_role, due_at, version, dan completed_at. Event task menyimpan actor_id, perubahan, alasan, serta waktu server. Status operasional: ready, claimed, waiting, returned, done, cancelled. Transisi wajib divalidasi server.

## Aturan handoff dan kegagalan

Buat langkah berikutnya hanya setelah prasyarat berhasil. Gunakan unique key untuk pasangan entity dan step, idempotency key untuk submit, serta kontrol versi untuk konflik dua petugas. returned kembali ke pemilik langkah yang perlu memperbaiki. Penolakan tidak boleh diam-diam menjadi done. Chat membantu koordinasi, tidak menjadi sumber keputusan.

Jangan menambahkan T02/T03 hanya sebagai tombol di UI: itu akan membuat saldo dan cerita proses tidak sesuai. Perlu migrasi domain, endpoint transisi, audit, serta pengujian lintas akun terlebih dahulu.

# SOP per peran dan contoh kerja tim

*FLOW / 10 | 26 Oktober 2026*

| Peran | Saat mulai | Saat menyerahkan pekerjaan |
| --- | --- | --- |
| Amil penerimaan | Buka Penerimaan; cek muzakki, pos, kanal, dan nominal. Jangan membuat duplikat. | Simpan form; pastikan kode tercatat. Target berikutnya: serahkan draft ke saksi, bukan posting langsung. |
| Amil penyalur | Periksa saldo tersedia dan kelayakan data; buka Penyaluran dan buat record. | Pilih metode konfirmasi; komunikasikan kode tugas. Jangan menyetujui record sendiri. |
| Saksi | Pilih Meja Saksi; aktifkan Tugas saya; cocokkan kode, pihak, dan bukti. | Berikan keputusan lewat alat asli. Jika bukti kurang, koordinasi dan jangan mengarang konfirmasi. |
| Penyetuju | Pilih Persetujuan; cek konfirmasi lengkap dan independensi akun/unit. | Putuskan lewat proses asli, bukan chat. Pastikan status sumber berubah sebelum menganggap handoff selesai. |
| Pencatat / pemeriksa | Buka Catatan, riwayat, dan alat pemeriksaan sesuai kebutuhan. | Periksa konsistensi hasil, jangan posting dua kali. Catat temuan untuk koreksi yang terlacak. |
| Administrator | Aktifkan fitur di lingkungan uji; periksa konfigurasi dan hak akses. | Pantau error dan hasil tes. Jangan mengaktifkan chat publik berisi data nyata dengan login demo. |

## Skenario uji empat akun

Pada sumber demo yang sama, Budi menyiapkan penyaluran metode saksi. Dewi mengonfirmasi pertama, Rian kedua, kemudian Hari memeriksa persetujuan. Meja Saksi kehilangan kartu aktif setelah status menjadi dikonfirmasi; Meja Persetujuan mendapat kartu. Setelah status sumber menjadi tersalurkan, kartu masuk Catatan.

Skenario di atas adalah target proses, bukan bukti bahwa otorisasi form lama sudah benar. Uji akun berbeda secara berurutan pada browser demo untuk memeriksa tampilan; penggunaan dua perangkat tidak berbagi transaksi. Untuk produksi, jalankan ulang skenario terhadap API/database bersama dan pastikan penolakan untuk pelaku/unit yang sama.

## Format koordinasi yang cukup

Gunakan pesan seperti: "Kode ZK1234567890, bukti perlu diperiksa sebelum persetujuan." Hindari menuliskan NIK, rekening, foto identitas, atau nominal yang tidak perlu. Balasan "sudah dicek" tidak menutup tugas; keputusan tetap harus tercatat melalui aksi resmi.
