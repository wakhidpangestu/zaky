# PRD: Zaky v4.0

**Produk:** Zaky, jaringan verifikasi penyaluran zakat antarlembaga
**Versi dokumen:** 4.0 (menggantikan v3.0)
**Target rilis lomba:** 29 Oktober 2026, pengumpulan paling lambat 30 Oktober pukul 23.59 WIB
**Status:** Draf untuk eksekusi

---

## 1. Ringkasan

### 1.1 Masalah
Catatan penyaluran zakat dapat berubah tanpa jejak, dan tidak ada pihak lain yang menyimpan salinan catatan untuk dibandingkan.

### 1.2 Solusi
Setiap lembaga anggota menjalankan instance Zaky sendiri dengan basis data dan kunci penandatanganan sendiri. Penyaluran sah hanya jika dicatat amil, dikonfirmasi penerima, dan disetujui dari unit lain. Setiap hari, hash kepala catatan setiap lembaga diterbitkan dan ditandatangani, lalu disaksikan lembaga anggota lain yang menyimpan salinannya.

### 1.3 Fitur Versi Lomba
- **Fitur A:** Pos dana dengan reservasi saldo.
- **Fitur B:** Penyaluran dengan konfirmasi mustahik atau dua saksi, lalu persetujuan dari unit lain.
- **Fitur C:** Jaringan verifikasi: rantai log, hash harian tertanda tangan, kesaksian antarlembaga, papan silang, dan kebijakan restore.

### 1.4 Di Luar Lingkup v4.0
- Pemeriksaan duplikasi mustahik lintas lembaga (dipindah ke roadmap, lihat bagian 13)
- Pemrosesan pembayaran atau transfer uang
- Zakat fitrah dalam bentuk beras atau makanan pokok
- Wakaf
- Perhitungan nisab, haul, atau keputusan syariah
- Dasbor muzakki dan notifikasi
- Integrasi dengan sistem resmi BAZNAS atau Kemenag
- Otoritas sertifikasi pusat untuk direktori anggota
- Aplikasi seluler native
- Anchor hash ke blockchain publik

---

## 2. Tujuan dan Metrik Keberhasilan

| Tujuan | Metrik | Target versi lomba |
| --- | --- | --- |
| Dana tidak disalurkan dua kali | Dua draf bersamaan, hanya satu lolos | 100% pada uji |
| Saldo tidak pernah negatif | Constraint dan uji konkurensi | 100% pada uji |
| Penyaluran sah membutuhkan konfirmasi dan persetujuan dari unit lain | Penyaluran tanpa syarat tidak pernah berstatus Tersalurkan | 100% pada uji |
| Konfirmasi saksi memenuhi syarat empat akun dan dua unit | Saksi dari unit sama dengan pembuat ditolak | 100% pada uji |
| Perubahan catatan terdeteksi | Setelah satu entri diubah, papan silang menampilkan Tidak cocok | Terdeteksi pada demo |
| Kesaksian antarlembaga berfungsi | Lembaga B dan C menyimpan hash A | Berfungsi pada demo |
| Ketersediaan | Halaman publik menampilkan salinan cache saat basis data gagal | Berfungsi pada uji |

---

## 3. Persona dan Peran

| Peran | Tanggung jawab | Batasan |
| --- | --- | --- |
| **Amil** | Membuat penerimaan dan draf penyaluran | Tidak bisa mengonfirmasi atau menyetujui penyaluran yang ia buat |
| **Mustahik** | Mengonfirmasi penerimaan lewat tautan sekali pakai (metode mustahik) | Tidak perlu akun |
| **Saksi** | Dua orang yang mengonfirmasi bagi mustahik tanpa ponsel (metode saksi) | Harus akun Zaky sendiri, dari unit berbeda dengan pembuat |
| **Penyetuju** | Menyetujui penyaluran yang sudah lolos konfirmasi | Akun dan unit berbeda dengan pembuat dan saksi |
| **Admin lembaga** | Mengelola akun, unit, dan kunci lembaga | Tidak bisa menyetujui penyaluran |
| **Publik** | Membaca halaman verifikasi dan papan silang | Tidak perlu akun |

**Verifikasi akun:** admin lembaga memastikan satu orang hanya memiliki satu akun. Pemeriksaan ini dilakukan di luar sistem dan dicatat dalam prosedur lembaga.

---

## 4. Fitur A: Pos Dana dengan Reservasi Saldo

- **FR-01:** Sistem menyediakan pos dana per program. Versi lomba memiliki dua pos: Zakat Maal dan Zakat Fitrah (uang).
- **FR-02:** Setiap pos memiliki empat angka: `total_masuk`, `saldo_tersedia`, `saldo_dicadangkan`, dan `total_tersalurkan`.
- **FR-03:** Invariant `total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan` ditegakkan constraint database pada setiap perubahan.
- **FR-04:** Saat draf penyaluran dibuat, nominalnya dipindah dari `saldo_tersedia` ke `saldo_dicadangkan` dalam satu transaksi yang mengunci baris pos.
- **FR-05:** Draf yang ditolak, dibatalkan, atau kedaluwarsa melepas reservasi.
- **FR-06:** Saat penyaluran disetujui, nominalnya dipindah dari `saldo_dicadangkan` ke `total_tersalurkan`.
- **FR-07:** `saldo_tersedia` dan `saldo_dicadangkan` tidak boleh negatif.
- **FR-08:** Saldo tidak dapat dipindahkan antarpos.

---

## 5. Penerimaan dan Hak Amil

- **FR-09:** Amil mencatat penerimaan dengan tanggal, pos, nominal bruto, kanal, dan keterangan muzakki (terdaftar atau anonim).
- **FR-10:** Nominal bruto dipisah menjadi `hak_amil` dan `masuk_pos`. Persentase hak amil diambil dari konfigurasi lembaga dan dicatat per transaksi. Konfigurasi default berlaku untuk semua pos, dengan opsi penggantian per pos yang dicatat di log.
- **FR-11:** `bruto = hak_amil + masuk_pos` dijaga constraint.
- **FR-12:** Penerimaan yang sudah disimpan tidak dapat diubah. Koreksi dilakukan dengan catatan koreksi baru.
- **FR-13:** Setiap penerimaan mendapat kode unik acak 12 karakter.

---

## 6. Fitur B: Penyaluran dengan Konfirmasi dan Persetujuan

### 6.1 Data Penyaluran
- **FR-14:** Amil membuat draf penyaluran dengan pos, penerima (mustahik terdaftar), nominal, dan bukti penerimaan. Pembuatan draf langsung mereservasi saldo sesuai FR-04.
- **FR-15:** Asnaf wajib dipilih dari delapan kategori: fakir, miskin, amil, muallaf, riqab, gharimin, fisabilillah, dan ibnu sabil. Asnaf penyaluran harus sama dengan asnaf yang tercatat pada data mustahik.
- **FR-16:** Bukti penerimaan wajib diunggah sebelum draf dapat diajukan. Berkas disimpan dengan hash SHA-256.
- **FR-17:** Mustahik terdaftar dengan `consent_at`. Lembaga bertanggung jawab memastikan dasar pemrosesan data sesuai UU 27/2022.

### 6.2 Status
- **FR-18:** Alur status: `dibuat` → `menunggu_konfirmasi` → `dikonfirmasi` → `disetujui` → `tersalurkan`.
- **FR-19:** Cabang status: `ditolak_penerima`, `kedaluwarsa`, dan `dibatalkan` (oleh amil sebelum konfirmasi). Dua cabang terakhir melepas reservasi.
- **FR-20:** Hanya `tersalurkan` yang dihitung sebagai dana tersalurkan.

### 6.3 Metode Konfirmasi A: Mustahik Berponsel
- **FR-21:** Mustahik menerima tautan konfirmasi sekali pakai ke nomor ponsel yang terdaftar. Tautan berlaku 72 jam.
- **FR-22:** Nomor ponsel disimpan sebagai HMAC-SHA256 dengan kunci lembaga. Nomor asli hanya dipakai untuk mengirim tautan.
- **FR-23:** Halaman konfirmasi menampilkan "Saya menerima" dan "Saya tidak menerima". Pilihan dicatat dengan waktu.
- **FR-24:** Metode ini sah dengan satu konfirmasi mustahik bernilai "menerima". Akun pembuat dan penyetuju harus berbeda.

### 6.4 Metode Konfirmasi B: Dua Saksi untuk Mustahik Tanpa Ponsel
- **FR-25:** Konfirmasi saksi dicatat sebagai **tepat dua baris** pada tabel konfirmasi, masing-masing dari akun saksi yang berbeda.
- **FR-26:** Penyaluran metode saksi sah apabila dan hanya apabila seluruh syarat berikut terpenuhi:
  - Ada dua konfirmasi saksi, keduanya bernilai "menerima".
  - Empat akun unik: amil pembuat, saksi 1, saksi 2, dan penyetuju, semuanya berbeda satu sama lain.
  - Unit saksi 1 dan saksi 2 berbeda dengan unit amil pembuat.
  - Unit penyetuju berbeda dengan unit amil pembuat.
  - Minimal dua unit berbeda terlibat dalam penyaluran.
- **FR-27:** Saksi tidak boleh sama dengan amil pembuat atau penyetuju. Penyetuju tidak boleh sama dengan amil pembuat.
- **FR-28:** Status `dikonfirmasi` hanya dapat dicapai ketika jumlah konfirmasi saksi bernilai "menerima" tepat dua. Konfirmasi saksi pertama saja tidak mengubah status.

### 6.5 Persetujuan
- **FR-29:** Penyetuju hanya dapat menyetujui penyaluran berstatus `dikonfirmasi`.
- **FR-30:** Penyetuju harus akun berbeda dari seluruh pelaku sebelumnya, dan unitnya berbeda dari unit pembuat.
- **FR-31:** Persetujuan mengonversi reservasi menjadi `total_tersalurkan` dan menulis entri log dalam transaksi yang sama.

---

## 7. Fitur C: Jaringan Verifikasi

### 7.1 Log Append-Only
- **FR-32:** Setiap perubahan status masuk tabel `audit_log` yang bersifat append-only. Trigger database menolak `UPDATE` dan `DELETE` dari jalur aplikasi.
- **FR-33:** Setiap entri menyimpan `hash_saat_ini = SHA-256(JCS(entri) || hash_sebelumnya)`. JCS mengacu pada RFC 8785.
- **FR-34:** Penulisan entri dilakukan dalam fungsi SQL di server basis data, bersama perubahan saldo dalam satu transaksi.

### 7.2 Urutan Penguncian (Wajib)
- **FR-35:** Urutan penguncian global: `pos_dana` → `penyaluran` → `rantai_kepala`. Setiap transaksi harus mengunci sesuai urutan ini. Tidak ada transaksi yang mengunci `rantai_kepala` lalu mencoba mengunci tabel lain.
- **FR-36:** Penerbitan hash harian hanya mengunci `rantai_kepala`, tidak pernah `pos_dana`, sehingga tidak membentuk siklus.
- **FR-37:** Penguncian `rantai_kepala` harus berlangsung kurang dari 2 ms dari awal `SELECT ... FOR UPDATE` sampai `COMMIT`. Waktu ini diukur dan dilaporkan.

### 7.3 Hash Harian
- **FR-38:** Setiap hari pukul 00.00 WIB, sistem menyusun payload hash harian berisi: versi, `lembaga_id`, tanggal, `hash_kepala`, dan `jumlah_entri`, dalam bentuk JCS.
- **FR-39:** Payload ditandatangani Ed25519 dengan kunci lembaga, lalu dipublikasikan di endpoint publik.
- **FR-40:** Penerbitan bersifat idempotent. Hari yang terlewat dikejar pada siklus berikutnya.
- **FR-41:** Hash yang sudah diterbitkan untuk suatu tanggal tidak pernah diterbitkan ulang dengan nilai berbeda. Penerbitan ulang dengan nilai berbeda dicatat sebagai pelanggaran integritas.

### 7.4 Kesaksian Antarlembaga
- **FR-42:** Direktori anggota berisi daftar lembaga beserta kunci publik Ed25519. Direktori disepakati semua operator instance dan hanya berubah melalui perubahan yang ditinjau semua anggota. Tidak ada otoritas pusat yang menandatangani direktori.
- **FR-43:** Setiap instance mengambil hash harian dari seluruh anggota lain, memverifikasi tanda tangannya terhadap direktori, dan menyimpan salinan.
- **FR-44:** Setelah memverifikasi, instance menandatangani kesaksian berisi `lembaga_id`, tanggal, dan `hash_kepala` yang disaksikan.
- **FR-45:** Kesaksian disimpan dan dipublikasikan.

### 7.5 Verifikasi Ulang dan Deteksi Perubahan
- **FR-46:** Papan silang tidak hanya membandingkan hash yang tersimpan. Papan silang juga **menghitung ulang** hash kepala untuk tanggal tertentu dari entri log saat ini, yaitu entri 1 sampai `jumlah_entri` pada tanggal tersebut.
- **FR-47:** Jika hasil hitung ulang, hash yang diterbitkan, atau hash yang disaksikan tidak cocok, status lembaga untuk tanggal tersebut adalah **Tidak cocok**. Tidak ada pengecualian untuk alasan teknis.
- **FR-48:** Setiap perubahan hash setelah penerbitan diperlakukan sebagai Tidak cocok, termasuk akibat pemulihan cadangan, perubahan manual, atau kesalahan teknis. Sistem tidak menebak niat.

### 7.6 Kebijakan Restore dan Immutability
- **FR-49:** Pemulihan cadangan tidak boleh kembali ke titik sebelum hash harian terakhir yang sudah diterbitkan.
- **FR-50:** Sistem tidak dapat secara teknis mencegah pemulihan oleh pemilik basis data. Karena itu, pencegahan dilakukan oleh prosedur, dan deteksi dilakukan oleh FR-46 sampai FR-48.
- **FR-51:** Jika lembaga melakukan pemulihan, lembaga wajib membuat catatan insiden tertulis yang memuat waktu, alasan, dan titik pemulihan. Catatan ini ditampilkan di halaman status lembaga.
- **FR-52:** Lembaga yang pemulihannya sudah terdeteksi sebagai Tidak cocok tidak dapat kembali berstatus Terkonfirmasi untuk tanggal tersebut.

### 7.7 Papan Silang
- **FR-53:** Papan silang menampilkan, per tanggal dan per lembaga, hash yang diterbitkan, hasil hitung ulang, dan jumlah kesaksian.
- **FR-54:** Status per lembaga:
  - **Terkonfirmasi:** hitung ulang cocok dengan hash terbit, dan disaksikan minimal dua lembaga lain tanpa ketidakcocokan.
  - **Belum cukup saksi:** kurang dari dua kesaksian.
  - **Tidak cocok:** salah satu dari FR-47 terpenuhi.
  - **Belum diterbitkan:** hash harian belum terbit.
- **FR-55:** Papan silang dapat dibuka tanpa login.

---

## 8. Verifikasi Publik

- **FR-56:** Halaman verifikasi menerima kode unik dan menampilkan: status, pos, asnaf, kabupaten penerima, tanggal, status konfirmasi, hash harian terakhir, dan jumlah kesaksian.
- **FR-57:** Nama mustahik disamarkan menjadi inisial. NIK, nomor ponsel, dan nama donatur tidak ditampilkan.
- **FR-58:** Jika rantai atau kesaksian tidak cocok, halaman menampilkan peringatan dan penjelasan singkat.

---

## 9. Keamanan dan Kepatuhan

| Kategori | Kebutuhan |
| --- | --- |
| Autentikasi | Email dan kata sandi di-hash dengan Argon2id. Sesi menggunakan cookie HTTP-only. |
| Otorisasi | Peran dan unit diperiksa di server pada setiap endpoint tulis. |
| Kunci | Kunci Ed25519 dan pepper disimpan di environment server, terpisah per lembaga. Rotasi mencatat tanggal pencabutan. |
| Input | Semua input divalidasi di server. Nominal dihitung ulang di server. |
| Privasi | Data pribadi minimum. Nomor ponsel disimpan sebagai HMAC. NIK tidak disimpan. |
| Akses publik | Rate limit per IP. Tidak ada endpoint daftar penuh. |
| Replay | Permintaan jaringan memuat nonce dan waktu, ditolak jika lebih dari 5 menit. |
| Aksesibilitas | WCAG 2.1 level AA. Skor Lighthouse aksesibilitas minimal 90. |

---

## 10. Ketersediaan

- **AV-01:** Halaman verifikasi dan papan silang menyimpan salinan status terakhir di Redis dengan masa berlaku 5 menit. Saat basis data tidak tersedia, halaman menampilkan salinan dengan waktu pengambilannya.
- **AV-02:** Permintaan konfirmasi atau persetujuan yang gagal disimpan dengan status `menunggu` dan diproses ulang.
- **AV-03:** Penerbitan hash harian dicoba ulang hingga tiga kali, lalu dikejar pada siklus berikutnya.
- **AV-04:** Pengambilan kesaksian dari lembaga lain dicoba ulang. Jika gagal, papan silang menampilkan "Belum diterbitkan" atau "Belum cukup saksi", tidak "Cocok".

---

## 11. Model Data

```
lembaga           (id, nama, kunci_publik_ed25519, aktif)
unit              (id, lembaga_id, nama)
akun              (id, lembaga_id, unit_id, peran, email, password_hash)
pos_dana          (id, nama, total_masuk, saldo_tersedia, saldo_dicadangkan, total_tersalurkan)
                   -- CHECK invariant FR-03, CHECK saldo >= 0
penerimaan        (id, kode_unik, pos_id, bruto, hak_amil, masuk_pos, kanal, dicatat_oleh, dicatat_pada)
                   -- CHECK bruto = hak_amil + masuk_pos
mustahik          (id, nama_samaran, kabupaten, asnaf, telepon_hmac, consent_at)
penyaluran        (id, kode_unik, pos_id, mustahik_id, asnaf, nominal, status,
                   dibuat_oleh, dibuat_unit, penyetuju_akun, penyetuju_unit,
                   kedaluwarsa_pada)
                   -- CHECK nominal > 0
                   -- CHECK penyetuju_akun <> dibuat_oleh
                   -- CHECK penyetuju_unit <> dibuat_unit
konfirmasi        (id, penyaluran_id, jenis, akun_saksi_id, unit_saksi, token_hash,
                   dipakai_pada, kedaluwarsa_pada, hasil)
                   -- UNIQUE (penyaluran_id, akun_saksi_id)
                   -- UNIQUE PARTIAL INDEX (penyaluran_id) WHERE jenis = 'mustahik'
bukti             (id, penyaluran_id, berkas_path, sha256)
audit_log         (nomor, entitas, entitas_id, aksi, pelaku, sebelum, sesudah,
                   waktu, hash_sebelumnya, hash_saat_ini)   -- append-only
rantai_kepala     (lembaga_id, nomor, hash_kepala)           -- dikunci saat tulis
hash_harian       (lembaga_id, tanggal, payload_jcs, hash_kepala, tanda_tangan,
                   kunci_id, diterbitkan_pada)                -- PK (lembaga_id, tanggal)
kesaksian         (saksi_lembaga_id, lembaga_id, tanggal, hash_disaksikan,
                   tanda_tangan_saksi, diamati_pada)          -- PK tiga kolom
```

**Catatan:** Aturan lintas tabel (asnaf penyaluran dan mustahik, unit saksi dan pembuat, empat akun unik, jumlah saksi tepat dua) diperiksa dalam fungsi SQL yang sama dengan transaksi penyaluran. Pengujian mencakup setiap kasus.

---

## 12. Skenario Penerimaan

| ID | Skenario | Hasil yang diharapkan |
| --- | --- | --- |
| AC-01 | Draf melebihi saldo tersedia | Ditolak: `INSUFFICIENT_AVAILABLE_BALANCE` |
| AC-02 | Dua draf Rp 800.000 bersamaan pada saldo Rp 1.000.000 | Tepat satu berhasil. Tersedia Rp 200.000, dicadangkan Rp 800.000 |
| AC-03 | Draf ditolak, dibatalkan, atau kedaluwarsa | Reservasi dilepas |
| AC-04 | Penyaluran disetujui | Reservasi berpindah ke total tersalurkan. Invariant tetap berlaku |
| AC-05 | Draf tanpa bukti | Ditolak: "Bukti penerimaan wajib diunggah." |
| AC-06 | Asnaf penyaluran tidak sama dengan asnaf mustahik | Ditolak |
| AC-07 | Pembuat menyetujui sendiri | Ditolak |
| AC-08 | Penyetuju dari unit yang sama dengan pembuat | Ditolak |
| AC-09 | Metode mustahik dengan konfirmasi menerima | Status menjadi dikonfirmasi |
| AC-10 | Mustahik menolak | Status `ditolak_penerima`, reservasi dilepas |
| AC-11 | Tautan konfirmasi dipakai dua kali | Ditolak |
| AC-12 | Tautan melewati 72 jam | Ditolak: kedaluwarsa |
| AC-13 | Metode saksi dengan hanya satu konfirmasi saksi | Status tetap menunggu konfirmasi |
| AC-14 | Saksi 1 dan saksi 2 dari akun yang sama | Ditolak oleh UNIQUE constraint |
| AC-15 | Saksi dari unit yang sama dengan pembuat | Ditolak |
| AC-16 | Saksi sama dengan penyetuju | Ditolak |
| AC-17 | Perintah UPDATE langsung pada log dari jalur aplikasi | Ditolak trigger |
| AC-18 | Log diubah dengan mematikan trigger lalu hash ulang | Papan silang menampilkan Tidak cocok berdasarkan hitung ulang dan kesaksian |
| AC-19 | Lembaga menerbitkan hash berbeda untuk tanggal yang sudah terbit | Ditolak dan dicatat sebagai pelanggaran integritas |
| AC-20 | Pemulihan cadangan ke titik sebelum hash terakhir | Papan silang menampilkan Tidak cocok. Catatan insiden wajib ada |
| AC-21 | Lembaga C belum menerbitkan hash | Papan silang menampilkan Belum diterbitkan |
| AC-22 | Permintaan kesaksian tanpa tanda tangan anggota | Ditolak |
| AC-23 | Basis data tidak tersedia saat halaman verifikasi dibuka | Halaman menampilkan salinan cache dengan waktu pengambilan |
| AC-24 | Permintaan publik melebihi batas laju | Ditolak dengan status 429 |

---

## 13. Roadmap v4.0: Pemeriksaan Duplikasi Lintas Lembaga

Fitur ini tidak dikerjakan pada versi lomba. Alasannya:

1. **Pendekatan naif tidak aman.** Jika anggota berbagi kunci HMAC untuk NIK, anggota yang memegang kunci dapat menghitung hash seluruh NIK yang mungkin secara offline. Ruang NIK bersifat terstruktur, sehingga pencarian ini cepat. Rotasi salt harian tidak menyelesaikan masalah, karena anggota tetap bisa melakukan pencarian dalam periode salt yang sama.
2. **Pembatasan laju tidak menutup celah.** Rate limit memperlambat pemeriksaan, tetapi tidak menghentikan pencarian sistematis terhadap daftar NIK.
3. **Waktu lomba terbatas.** Tiga instance, rantai log, dan kesaksian sudah membutuhkan seluruh waktu enam hari. Menambah protokol kriptografi yang belum teruji akan melemahkan fitur inti.

**Rancangan untuk versi berikutnya:**
- Protokol Oblivious Pseudorandom Function (OPRF): lembaga yang meminta pemeriksaan mengirim nilai buta (blinded), dan lembaga lain menghitung PRF tanpa melihat NIK. Kunci PRF dimiliki masing-masing lembaga, sehingga tidak ada kunci bersama.
- Atau Private Set Intersection (PSI), yang hanya membuka jumlah irisan tanpa membuka elemennya.
- Rate limit dan kuota per lembaga untuk setiap permintaan, serta audit log untuk setiap permintaan yang diterima.
- Evaluasi keamanan independen sebelum fitur dirilis.

---

## 14. Rencana Rilis

| Hari | Target | Output |
| --- | --- | --- |
| 1 (24 Okt) | Skema, akun, unit, pos dengan empat saldo, constraint invariant | Basis data dan login berfungsi |
| 2 (25 Okt) | Penerimaan, hak amil, fungsi reservasi dalam SQL, uji konkurensi | AC-01 sampai AC-04 lulus |
| 3 (26 Okt) | Penyaluran, konfirmasi mustahik, dua baris saksi, persetujuan | AC-05 sampai AC-16 lulus |
| 4 (27 Okt) | Log append-only, rantai kepala terkunci, hash harian tertanda tangan | AC-17 lulus, uji urutan penguncian lulus |
| 5 (28 Okt) | Kesaksian, papan silang, hitung ulang, kebijakan restore | AC-18 sampai AC-22 lulus |
| 6 (29 Okt) | Ketersediaan, halaman publik, skenario demo, video, dokumentasi | AC-23 dan AC-24 lulus, bahan pengumpulan siap |

**Prioritas jika waktu tidak cukup:** Fitur A dan B wajib selesai. Fitur C wajib menyelesaikan hash harian, kesaksian, dan papan silang dengan hitung ulang. Ketersediaan dan halaman publik dapat disederhanakan, tetapi cache saat gangguan tetap diuji.

---

## 15. Skenario Demo

Demo mengikuti urutan tetap. Setiap langkah harus selesai sebelum langkah berikutnya.

1. Penyaluran normal dengan metode mustahik (sesuai bagian 6.3).
2. Uji konkurensi saldo dengan dua draf bersamaan.
3. Penyaluran metode saksi dengan empat akun unik.
4. Penerbitan hash harian Lembaga A, lalu penyaksian oleh Lembaga B dan C.
5. Serangan admin: `serang-log.sh` mematikan trigger dengan akses superuser, mengubah nominal satu penyaluran, lalu menghidupkan trigger kembali. Demo menampilkan perintah ini tanpa disembunyikan.
6. Papan silang menghitung ulang hash Lembaga A dan membandingkannya dengan kesaksian B dan C. Status Tidak cocok ditampilkan dengan dua hash berdampingan.

**Infrastruktur demo:** tiga instance berjalan di tiga proyek basis data terpisah dengan tiga kunci. Jika kuota tidak memungkinkan, skema terpisah digunakan dan batasan ini ditulis di slide.

---

## 16. Risiko

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Waktu enam hari tidak cukup | Tinggi | Scope dikunci pada fitur A, B, dan C. Duplikasi sudah di roadmap. |
| Juri menganggap tiga instance tidak independen | Tinggi | Diakui di proposal dan slide. Isolasi proyek basis data ditunjukkan. |
| Penguncian melebihi 2 ms di lingkungan demo | Sedang | Logika dipindah ke fungsi SQL agar satu kali round trip. Waktu diukur dan dilaporkan jujur. |
| Demo serangan dianggap sandiwara | Sedang | Urutan demo tetap. Superuser ditampilkan secara terbuka. |
| Kesalahan pemahaman hukum zakat | Tinggi | Rujuk UU 23/2011. Tidak mengklaim keputusan syariah atau hak amil otomatis. |

---

## 17. Pertanyaan Terbuka

1. Siapa yang menetapkan persentase hak amil default, dan prosedur penggantian per pos?
2. Bagaimana perubahan direktori anggota ditinjau dan disetujui jika anggotanya hanya tiga instance demo?
3. Apakah prosedur kunci Ed25519 perlu grace period untuk verifikasi hash lama setelah rotasi?
