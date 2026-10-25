# Zaky: Jaringan Verifikasi Penyaluran Zakat Antarlembaga

**Tagline:** Setiap lembaga mencatat sendiri, tetapi catatannya saling disaksikan.

**Lomba:** Web Development Competition UINIC 8.0
**Tema:** Engineering Interconnected Web Solutions to Empower Digital Ecosystems
**Subtema:** Sosial Budaya
**Penyelenggara:** HMPS Informatika UIN Sunan Kalijaga Yogyakarta

> Catatan: Proposal dikumpulkan dalam format PDF, maksimal 30 halaman (tidak termasuk lampiran), menggunakan template resmi panitia. Versi Markdown ini adalah bahan kerja.

---

## a. Identitas Tim

| Peran | Nama | Instansi |
| --- | --- | --- |
| Ketua Tim / Full-Stack Lead | [Isi nama] | [Isi instansi] |
| Anggota 1 / Backend dan Keamanan | [Isi nama] | [Isi instansi] |
| Anggota 2 / Frontend dan Dokumentasi | [Isi nama] | [Isi instansi] |

Tautan demo: [isi setelah deploy]
Tautan repositori GitHub: [isi, dibuat setelah periode lomba dimulai]

---

## b. Judul Karya

**Zaky: Sistem Pencatatan Penyaluran Zakat dengan Kesaksian Antarlembaga dan Konfirmasi Penerima**

---

## c. Latar Belakang Masalah

Zakat adalah instrumen keuangan sosial Islam yang berpotensi besar mengurangi kemiskinan dan ketimpangan. Kepercayaan muzakki (pemberi zakat) bergantung pada satu pertanyaan: apakah dana benar-benar sampai kepada mustahik yang berhak?

Dua masalah membuat pertanyaan itu sulit dijawab:

1. **Catatan internal mudah berubah tanpa jejak.** Penyaluran sering dicatat dalam dokumen yang diunggah berkala. Pihak luar tidak bisa mengetahui apakah catatan itu pernah diubah.
2. **Tidak ada pihak lain yang ikut menyimpan salinan catatan.** Lembaga yang mengubah catatan tidak menghadapi pembanding apa pun di luar dirinya.

Perangkat lunak tidak bisa menggantikan integritas pengurus. Namun, perangkat lunak dapat membuat setiap lembaga bertanggung jawab atas catatannya di hadapan lembaga lain, sehingga perubahan diam-diam menjadi terlihat.

> Data pendukung: [isi angka dan sumber resmi. Jangan mencantumkan angka tanpa sumber.]

---

## d. Tujuan dan Manfaat

### Tujuan
1. Setiap lembaga anggota mencatat penyaluran dengan aturan yang sama: saldo dicadangkan sejak draf, asnaf wajib, konfirmasi penerima, dan persetujuan dari unit lain.
2. Setiap hari, catatan setiap lembaga diringkas menjadi satu hash yang ditandatangani, lalu **disaksikan lembaga anggota lain** yang menyimpan salinannya sendiri.
3. Muzakki dan publik dapat melihat apakah catatan sebuah lembaga masih konsisten dengan kesaksian lembaga lain.

### Pemetaan SDG

| SDG | Keterkaitan dengan Zaky |
| --- | --- |
| SDG 1: Tanpa Kemiskinan | Penyaluran tercatat per asnaf, termasuk fakir dan miskin, dan dapat diperiksa apakah sampai kepada yang berhak. |
| SDG 16: Institusi yang Tangguh | Lembaga saling menyaksikan catatan, dan publik dapat memverifikasi tanpa bergantung pada satu pihak. |

---

## e. Analisis

### Tema dan Interkoneksi: Inti Karya

| Bentuk keterhubungan | Yang terhubung | Fungsi |
| --- | --- | --- |
| Hash harian yang ditandatangani | Instance antarlembaga | Hash lembaga A dapat diperiksa oleh lembaga B dan C |
| Kesaksian | Salinan yang disimpan lembaga lain | Perubahan catatan oleh lembaga A terlihat walau A mengubah basis datanya sendiri |
| Papan silang | Hasil kesaksian semua anggota | Muzakki melihat status konsistensi seluruh jaringan dalam satu halaman |

### Target Pengguna
1. **Amil:** mencatat penerimaan dan membuat draf penyaluran.
2. **Penyetuju:** menyetujui penyaluran dari unit lain.
3. **Mustahik atau saksi:** mengonfirmasi penerimaan.
4. **Muzakki dan publik:** memverifikasi kode dan membaca papan silang.

### Analisis Pembanding

| Aspek | Dokumen PDF laporan | Sistem pelaporan internal | Platform donasi dengan laporan publik | Zaky |
| --- | --- | --- | --- | --- |
| Perubahan terdeteksi setelah terjadi | Tidak | Tergantung sistem | Tergantung platform | Ya, lewat salinan kesaksian lembaga lain |
| Konfirmasi dari penerima | Tidak | Umumnya tidak | Tidak umum | Ya |
| Salinan independen di luar lembaga | Tidak | Tidak | Tidak | Ya, disimpan lembaga anggota |
| Biaya dan integrasi | Rendah | Tinggi, tertutup | Tergantung kontrak | Rendah, sumber terbuka |

Analisis ini belum mencakup survei pengguna dan perlu dilengkapi jika waktu memungkinkan.

### Batasan Produk
- Zaky adalah **perangkat pencatat dan verifikasi untuk lembaga zakat berizin**. Zaky bukan penghimpun dana dan tidak memproses pembayaran.
- Zaky tidak menentukan keabsahan keputusan syariah, perhitungan nisab, atau besaran hak amil yang ditetapkan lembaga.
- Versi lomba hanya mencakup zakat dalam bentuk uang rupiah.
- Wakaf dan pemeriksaan duplikasi mustahik lintas lembaga masuk roadmap.

### Batasan yang Diakui
- **Lembaga yang bersekongkol dengan saksinya tidak bisa dideteksi.** Kesaksian hanya bernilai selama anggota jujur.
- **Deteksi perubahan bergantung pada waktu.** Perubahan terdeteksi jika hash sebelumnya sudah disaksikan. Perubahan sebelum hash pertama disaksikan tidak terdeteksi.
- **Pemilik basis data dapat mematikan trigger.** Trigger mencegah perubahan lewat jalur aplikasi, tetapi tidak menghentikan superuser. Karena itu bukti perubahan berasal dari hash yang sudah disaksikan di luar basis data.
- **Demo lomba menggunakan tiga instance yang dijalankan tim.** Setiap instance berjalan di proyek basis data terpisah, sehingga isolasi data dapat diperlihatkan. Namun independensi organisasi belum terbukti, karena ketiganya tetap dijalankan tim yang sama.
- **Konfirmasi bergantung pada akses ponsel atau saksi.** Mustahik tanpa ponsel memerlukan dua saksi, sehingga prosesnya lebih lambat.
- **Zaky tidak membuktikan uang fisik sampai ke tangan mustahik.** Zaky membuktikan bahwa konfirmasi dan persetujuan tercatat dan tidak diubah diam-diam.

---

## f. Platform dan Framework

- **Aplikasi:** Next.js (App Router) dengan TypeScript
- **Basis data:** PostgreSQL, dengan logika penyaluran dan penulisan log dalam fungsi SQL yang berjalan di server basis data
- **Kriptografi:** HMAC-SHA256 untuk nomor ponsel mustahik, Ed25519 untuk tanda tangan hash harian dan kesaksian, SHA-256 untuk rantai log
- **Cache dan rate limit:** Redis
- **Penjadwal:** Vercel Cron
- **Pengujian:** Vitest, Playwright, dan skrip uji konkurensi serta uji serangan

---

## g. Metodologi Pengembangan

Tim menggunakan Agile dengan target harian selama enam hari kerja. Scope dikunci pada dua fitur inti dan satu fitur jaringan. Fitur yang belum selesai pada hari kelima tidak ditambahkan, dan pengujian tetap dijalankan.

| Hari | Fokus |
| --- | --- |
| 1 (24 Okt) | Skema basis data, akun dan unit, pos dengan empat saldo, constraint invariant |
| 2 (25 Okt) | Penerimaan, hak amil, reservasi saldo dalam fungsi SQL, uji konkurensi |
| 3 (26 Okt) | Penyaluran tiga pihak, konfirmasi mustahik, konfirmasi saksi dua baris, persetujuan |
| 4 (27 Okt) | Log append-only, rantai kepala terkunci, hash harian tertanda tangan |
| 5 (28 Okt) | Kesaksian antarinstance, papan silang, verifikasi ulang dari log |
| 6 (29 Okt) | Skenario demo, pengujian pengguna, dokumentasi, video, pengumpulan |

---

## h. Arsitektur Sistem

```
   Lembaga A (proyek basis data A)     Lembaga B (proyek basis data B)     Lembaga C (proyek basis data C)
 ┌──────────────────────────────┐    ┌──────────────────────────────┐    ┌──────────────────────────────┐
 │ Pos · Penyaluran · Log       │    │ Pos · Penyaluran · Log       │    │ Pos · Penyaluran · Log       │
 │ Hash harian (Ed25519)        │◄──►│ Hash harian (Ed25519)        │◄──►│ Hash harian (Ed25519)        │
 │ Salinan kesaksian A, B, C    │    │ Salinan kesaksian A, B, C    │    │ Salinan kesaksian A, B, C    │
 └──────────────────────────────┘    └──────────────────────────────┘    └──────────────────────────────┘
                                 Papan silang publik (membaca dari ketiganya)
```

Setiap lembaga menyimpan salinan hash milik lembaga lain. Salinan inilah yang membuat perubahan dapat dibuktikan, walaupun basis data lembaga yang berubah dimiliki pihak yang sama.

Penjelasan lengkap ada di dokumen arsitektur v4.

---

## i. Skenario Demo

Urutan demo dibuat tetap agar bukti tidak bisa dipertanyakan:

1. **Penyaluran normal.** Amil di Lembaga A membuat draf Rp 800.000 dari pos zakat maal. Saldo tersedia berkurang dan saldo dicadangkan bertambah. Mustahik menekan "Saya menerima" di ponsel. Penyetuju dari unit lain menyetujui. Saldo berpindah ke tersalurkan.
2. **Konkurensi saldo.** Skrip mengirim dua draf Rp 800.000 bersamaan pada saldo tersedia Rp 1.000.000. Hanya satu berhasil, dan yang lain gagal dengan kode `INSUFFICIENT_AVAILABLE_BALANCE`.
3. **Publikasi dan kesaksian.** Hash harian Lembaga A untuk tanggal demo diterbitkan. Lembaga B dan C mengambilnya, memverifikasi tanda tangan, dan menyimpan kesaksian.
4. **Serangan admin.** Skrip `serang-log.sh` dijalankan dengan akses superuser: trigger dimatikan, nominal satu penyaluran diubah, lalu trigger dihidupkan kembali. Demo menampilkan perintah ini secara terbuka.
5. **Papan silang.** Halaman papan silang memverifikasi ulang hash Lembaga A dari log yang sudah diubah dan membandingkannya dengan kesaksian B dan C. Status Lembaga A menjadi "Tidak cocok" dengan dua hash yang ditampilkan berdampingan.

Langkah 3 wajib selesai sebelum langkah 4. Jika urutannya terbalik, perubahan tidak dapat dibuktikan.

---

## j. Wireframe Layar Utama

**1. Dasbor amil**
```
┌─ Zaky · Lembaga A ───────────────────────────────── [Buat penyaluran] ─┐
│ Pos Dana                                                              │
│ ┌─ Zakat Maal ────────────┐ ┌─ Zakat Fitrah Uang ─────┐              │
│ │ Total masuk  Rp 6.000.000│ │ Total masuk  Rp 1.400.000│              │
│ │ ○ Tersedia   Rp 1.000.000│ │ ○ Tersedia   Rp   400.000│              │
│ │ ◐ Dicadangkan Rp   800.000│ │ ◐ Dicadangkan Rp      0 │              │
│ │ ● Tersalurkan Rp 4.200.000│ │ ● Tersalurkan Rp 1.000.000│            │
│ └──────────────────────────┘ └─────────────────────────┘              │
└───────────────────────────────────────────────────────────────────────┘
```

**2. Penanda langkah penyaluran (metode saksi)**
```
ZK7H3Q9PLM2A · Rp 800.000 · Zakat maal · Asnaf: fakir
 (1) Dibuat oleh          Amil Budi (Unit Pelayanan)        ✓  27 Okt 09.10
 (2) Saksi 1              Dewi (Unit Keuangan)               ✓  27 Okt 10.02
 (3) Saksi 2              Rian (Unit Kepegawaian)            ⏳  batas 30 Okt
 (4) Disetujui oleh       Penyetuju Hari (Unit Keuangan)     —
```

**3. Halaman konfirmasi mustahik (ponsel)**
```
Konfirmasi penerimaan zakat
Lembaga A menyalurkan Rp 800.000 kepada Anda pada 27 Oktober.
Tautan ini berlaku 72 jam.

[ Saya menerima ]
[ Saya tidak menerima ]
```

**4. Verifikasi publik**
```
Kode: ZK7H3Q9PLM2A                                  [✓ Terverifikasi]
Status: Tersalurkan · Zakat maal · Asnaf fakir · Kabupaten Sleman
Hash harian lembaga: 9f2c...e41a · disaksikan 2 lembaga lain
```

**5. Papan silang**
```
Tanggal 27 Okt 2026
Lembaga A   9f2c...e41a   ✓ disaksikan 2 dari 2
Lembaga B   7ab0...33d1   ✓ disaksikan 2 dari 2
Lembaga C   —             ⏳ belum diterbitkan
```

---

## k. Fitur Unggulan

1. **Saldo dicadangkan sejak draf.** Dana yang sudah dijanjikan tidak bisa disalurkan dua kali, dan hal ini dibuktikan dengan uji konkurensi.
2. **Tiga atau empat akun dari unit berbeda.** Konfirmasi saksi mensyaratkan empat akun unik dan minimal dua unit.
3. **Kesaksian antarlembaga.** Lembaga lain menyimpan salinan hash, sehingga perubahan dapat dibuktikan walaupun basis data lembaga diubah.
4. **Kebijakan restore yang eksplisit.** Pemulihan cadangan yang melewati hash terakhir yang sudah disaksikan langsung terlihat sebagai ketidakcocokan.

---

## l. Ketersediaan Sistem

- Halaman publik menggunakan cache dengan masa berlaku 5 menit. Saat basis data bermasalah, halaman menampilkan salinan cache beserta waktu pengambilannya.
- Permintaan konfirmasi atau persetujuan yang gagal disimpan dengan status "Menunggu" dan diproses ulang.
- Penerbitan hash harian dicoba ulang hingga tiga kali dan dikejar pada siklus berikutnya jika terlewat.
- Kesaksian yang gagal diambil dicoba ulang, dan papan silang menampilkan "Belum diterbitkan", bukan "Cocok".

---

## m. Hasil Pengujian

Pengujian yang dijalankan dan didemonstrasikan:
- **Konkurensi saldo:** dua draf bersamaan. Hasil: tepat satu berhasil, saldo tidak negatif.
- **Konfirmasi saksi:** saksi dari unit yang sama dengan pembuat ditolak. Hasil: penyaluran tidak berstatus Dikonfirmasi.
- **Rantai log:** perubahan satu entri terdeteksi oleh verifikasi ulang.
- **Kesaksian:** lembaga B dan C menyimpan hash lembaga A, lalu papan silang menampilkan jumlah saksi yang benar.
- **Pengguna:** uji tugas dengan minimal lima responden untuk peran amil dan mustahik.

[Isi hasil konkret setelah pengujian dilakukan. Jangan menulis angka yang belum diukur.]

---

## n. Kesimpulan

Zaky tidak mengklaim menghilangkan kebutuhan kepercayaan. Zaky membuat setiap lembaga bertanggung jawab atas catatannya di hadapan lembaga lain, dan membuat setiap perubahan catatan dapat dibuktikan walaupun dilakukan oleh pemilik basis data.

---

## o. Roadmap v4.0 dan Rancangan Masa Depan

- **Pemeriksaan duplikasi mustahik lintas lembaga.** Rancangannya memakai protokol Oblivious Pseudorandom Function (OPRF) atau Private Set Intersection (PSI), sehingga lembaga tidak perlu berbagi kunci yang dapat dipakai menebak NIK secara offline. Versi lomba tidak mengimplementasikannya. Pendekatan naif dengan HMAC kunci bersama tidak dipakai karena ruang NIK yang terstruktur membuatnya rentan terhadap pencarian offline.
- Zakat fitrah dalam bentuk beras atau makanan pokok.
- Wakaf dengan akad, nazhir, dan pelaporan aset.
- Dasbor muzakki dan notifikasi penyaluran.
- Lembaga sungguhan yang menjalankan instance sendiri, untuk membuktikan independensi.
- Integrasi dengan sistem pelaporan resmi.
- Anchor hash harian ke blockchain publik sebagai lapisan tambahan.

---

## p. Daftar Pustaka

1. [Isi: UU No. 23 Tahun 2011 tentang Pengelolaan Zakat, dengan perubahan yang berlaku]
2. [Isi: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi]
3. [Isi: sumber data latar belakang masalah]
4. [Isi: dokumen SDG dari Perserikatan Bangsa-Bangsa]
5. [Isi: RFC 8785 JSON Canonicalization Scheme]
6. [Isi: RFC 8032 Edwards-Curve Digital Signature Algorithm]

---

## Lampiran

- Lampiran A: Surat Pernyataan Orisinalitas Karya (ditandatangani ketua tim)
- Lampiran B: Tangkapan layar antarmuka
- Lampiran C: Keluaran skrip uji konkurensi dan uji serangan
