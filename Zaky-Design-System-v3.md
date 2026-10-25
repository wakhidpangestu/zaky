# Design System Zaky v3.0

**Tagline:** Setiap lembaga mencatat sendiri, tetapi catatannya saling diperiksa.
**Dokumen terkait:** Zaky-PRD-v3.md, Zaky-Architecture-v3.md
**Menggantikan:** Zaky-Design-System-v2.md

---

## 1. Prinsip Desain

1. **Tenang, bukan ramai.** Dana umat adalah topik sensitif. Hindari warna mencolok dan animasi berlebihan.
2. **Bukti selalu terlihat.** Kode unik, langkah tiga pihak, dan status kesaksian tampil di tempat yang mudah ditemukan.
3. **Interkoneksi terlihat.** Setiap tampilan yang menyangkut catatan menunjukkan apakah catatan itu sudah disaksikan lembaga lain.
4. **Status tidak hanya warna.** Setiap status memiliki ikon dan teks.
5. **Bahasa sederhana.** Istilah fiqih tetap dipakai dengan penjelasan singkat.

---

## 2. Warna

### 2.1 Palet Utama

| Token | Hex | Penggunaan |
| --- | --- | --- |
| `--zaky-primary-700` | `#0F5C4D` | Tombol utama, header, tautan aktif |
| `--zaky-primary-600` | `#137A66` | Hover, fokus |
| `--zaky-primary-100` | `#D7F0E8` | Latar status positif |
| `--zaky-accent-500` | `#C8962E` | Aksen kecil, maksimal 5% layar |
| `--zaky-accent-100` | `#F7EDD6` | Latar sorotan |
| `--zaky-neutral-900` | `#14201D` | Teks utama |
| `--zaky-neutral-600` | `#4B5A56` | Teks sekunder |
| `--zaky-neutral-300` | `#C9D3D0` | Garis, batas input |
| `--zaky-neutral-50` | `#F6F8F7` | Latar halaman |
| `--zaky-surface` | `#FFFFFF` | Latar kartu |

### 2.2 Status Penyaluran

| Status | Latar | Teks | Ikon | Arti |
| --- | --- | --- | --- | --- |
| Dibuat | `#EEF2F7` | `#3B4A5E` | Titik | Draf, saldo dicadangkan |
| Menunggu konfirmasi | `#FDF3DC` | `#7A5A0B` | Jam | Menunggu mustahik atau saksi |
| Ditolak penerima | `#FBE4E4` | `#9B1C1C` | Silang | Mustahik menolak |
| Dikonfirmasi | `#E6EEF8` | `#1D4E89` | Dua titik | Menunggu persetujuan unit lain |
| Disetujui | `#E6EEF8` | `#1D4E89` | Dua centang | Disetujui, menunggu penutupan |
| Tersalurkan | `#D7F0E8` | `#0F5C4D` | Centang | Sah, dihitung sebagai tersalurkan |
| Kedaluwarsa | `#EEF2F7` | `#4B5A56` | Jam dengan garis | Batas waktu lewat, saldo dilepas |
| Dibatalkan | `#EEF2F7` | `#4B5A56` | Garis miring | Dibatalkan amil, saldo dilepas |

### 2.3 Status Kesaksian dan Verifikasi

| Status | Latar | Teks | Ikon | Arti |
| --- | --- | --- | --- | --- |
| Terkonfirmasi | `#D7F0E8` | `#0F5C4D` | Perisai centang | Disaksikan minimal dua lembaga lain, tidak ada ketidakcocokan |
| Belum cukup saksi | `#FDF3DC` | `#7A5A0B` | Dua orang | Kurang dari dua kesaksian |
| Tidak cocok | `#FFF1E0` | `#8A4B08` | Segitiga | Ada kesaksian untuk hash berbeda |
| Belum diterbitkan | `#EEF2F7` | `#4B5A56` | Jam | Hash harian belum terbit |

Status "Tidak cocok" memakai warna oranye, bukan merah. Merah dicadangkan untuk penolakan yang dilakukan pengguna.

### 2.4 Kontras

Teks normal minimal 4.5:1, teks besar minimal 3:1. Semua kombinasi di atas harus diperiksa sebelum rilis.

### 2.5 Mode Gelap

```css
:root[data-theme="dark"] {
  --zaky-neutral-50: #0E1715;
  --zaky-surface: #15201D;
  --zaky-neutral-900: #E9F1EE;
  --zaky-neutral-600: #A9BAB5;
  --zaky-neutral-300: #2E3D39;
  --zaky-primary-700: #4FC3A6;
}
```

---

## 3. Tipografi

- **Sans:** Plus Jakarta Sans
- **Mono:** JetBrains Mono, untuk kode unik dan hash
- **Fallback:** `system-ui, -apple-system, "Segoe UI", sans-serif`

| Token | Ukuran | Bobot | Penggunaan |
| --- | --- | --- | --- |
| `display` | 40px | 700 | Judul verifikasi publik |
| `h1` | 32px | 700 | Judul halaman |
| `h2` | 24px | 600 | Judul bagian |
| `h3` | 18px | 600 | Judul kartu |
| `body` | 16px | 400 | Teks utama. Halaman konfirmasi mustahik minimal 18px. |
| `small` | 14px | 400 | Keterangan |
| `mono` | 14px | 500 | Kode unik, hash |

Ukuran minimal 14px di semua layar.

---

## 4. Spasi, Grid, dan Bentuk

- **Spasi:** 4, 8, 12, 16, 24, 32, 48, 64 piksel
- **Radius:** kartu 12px, tombol 10px, input 8px, badge 999px
- **Bayangan kartu:** `0 1px 2px rgba(20,32,29,0.06), 0 4px 12px rgba(20,32,29,0.04)`
- **Grid:** 12 kolom desktop (maksimal 1200px), 4 kolom mobile
- **Breakpoint:** 640px dan 1024px

---

## 5. Komponen

### 5.1 Kartu Saldo Tiga Angka

Menampilkan `total_masuk` sebagai judul, lalu tiga angka di bawahnya: tersedia, dicadangkan, dan tersalurkan. Setiap angka memiliki label dan ikon.

```
┌─ Zakat Maal ──────────────────────────┐
│ Total masuk          Rp 6.000.000     │
│ ○ Tersedia           Rp 1.000.000     │
│ ◐ Dicadangkan        Rp   800.000     │
│ ● Tersalurkan        Rp 4.200.000     │
└───────────────────────────────────────┘
```

Dicadangkan ditampilkan dengan gaya garis putus-putus, untuk menunjukkan dana yang sudah dijanjikan tetapi belum disalurkan.

### 5.2 Penanda Langkah Tiga Pihak

Komponen wajib di halaman detail penyaluran. Menampilkan tiga langkah berurutan dengan status masing-masing:

```
(1) Dibuat oleh       Amil (Unit Pelayanan)        ✓   27 Okt 09.10
(2) Dikonfirmasi oleh Mustahik via tautan          ⏳   batas 30 Okt 09.10
(3) Disetujui oleh    Penyetuju (Unit Keuangan)    —
```

Langkah yang belum selesai ditandai dengan ikon jam. Langkah yang diselesaikan oleh pihak dari unit yang sama dengan pembuat tidak boleh ditampilkan sebagai valid. Tampilkan pesan kesalahan.

### 5.3 Tombol Persetujuan

- Aktif hanya untuk penyetuju yang bukan pembuat dan berasal dari unit berbeda.
- Jika tidak aktif, tampilkan alasan di bawah tombol: "Anda tidak dapat menyetujui penyaluran yang Anda buat" atau "Penyetuju harus dari unit lain".
- Jangan hanya menonaktifkan tombol tanpa penjelasan.

### 5.4 Halaman Konfirmasi Mustahik

Layout satu kolom, tanpa navigasi, dirancang untuk ponsel:

- Judul: "Konfirmasi penerimaan zakat"
- Ringkasan: nominal, tanggal, dan nama lembaga penyalur
- Dua tombol besar, tinggi minimal 52px: "Saya menerima" dan "Saya tidak menerima"
- Teks penjelasan di bawah tombol: apa yang terjadi setelah memilih
- Hitung mundur 72 jam, diperbarui per menit tanpa animasi

Hindari istilah teknis seperti hash atau token pada halaman ini.

### 5.5 Badge Verifikasi

Ditampilkan di halaman verifikasi publik. Menggabungkan dua pemeriksaan:

- **Rantai log:** cocok atau tidak cocok
- **Kesaksian:** Terkonfirmasi, Belum cukup saksi, atau Tidak cocok

Tampilkan keduanya sebagai dua badge kecil, bukan satu badge tunggal, agar pengguna tahu sumber masalahnya.

### 5.6 Kartu Hash Harian

Menampilkan tanggal, nama lembaga, hash kepala (mono, dapat disalin), jumlah entri, waktu penerbitan, dan jumlah kesaksian. Tombol "Lihat kesaksian" membuka daftar lembaga yang menyaksikan.

### 5.7 Papan Silang

Tabel dengan kolom per lembaga dan baris per tanggal:

| Sel | Tampilan |
| --- | --- |
| Terkonfirmasi | Latar `primary-100`, ikon perisai centang, jumlah saksi |
| Belum cukup saksi | Latar kuning muda, ikon dua orang |
| Tidak cocok | Latar oranye muda, ikon segitiga, dua hash ditampilkan berdampingan |
| Belum diterbitkan | Teks abu-abu, ikon jam |

Di mobile, tabel berubah menjadi kartu per tanggal. Setiap kartu menampilkan lembaga dan statusnya secara berurutan.

Judul di atas tabel: "Papan silang: hash harian lembaga anggota untuk tanggal [pilih tanggal]".

### 5.8 Pesan Penolakan

```
[ikon silang]  Penyaluran belum dapat disetujui
               Penyetuju harus dari unit yang berbeda dengan pembuat.
               Kode: SAME_UNIT_APPROVER
               [Pilih penyetuju lain]
```

Kode error ditampilkan dalam mono kecil agar bisa dirujuk tim teknis.

### 5.9 Pemeriksaan Duplikasi

Tampilan di formulir penyaluran, saat amil memilih mustahik:

- Setelah pemeriksaan: "Tidak ada catatan di lembaga anggota lain dalam 12 bulan terakhir" atau "Ada catatan di 1 lembaga anggota lain dalam 12 bulan terakhir."
- Jangan menyebut nama lembaga lain. Jangan menampilkan data mustahik.
- Jika jaringan tidak bisa dihubungi: "Pemeriksaan belum dapat dilakukan. Penyaluran tetap bisa diajukan, tetapi dicatat sebagai belum diperiksa."

### 5.10 Timeline Jejak

Urutan vertikal: pembuatan, konfirmasi, persetujuan, dan penerbitan hash. Setiap item menampilkan waktu, peran pelaku, dan hash singkat.

### 5.11 Tabel Ledger

- Baris genap menggunakan `neutral-50`.
- Kolom nominal rata kanan dengan `font-variant-numeric: tabular-nums`.
- Di mobile, tabel menjadi kartu.

### 5.12 Tombol

| Varian | Latar | Teks | Penggunaan |
| --- | --- | --- | --- |
| Primer | `primary-700` | Putih | Satu per layar |
| Sekunder | Putih, batas `neutral-300` | `primary-700` | Aksi pendukung |
| Teks | Transparan | `primary-700` | Aksi ringan |
| Berbahaya | `#9B1C1C` | Putih | Penolakan atau pembatalan saja |

Tinggi minimal 44px. Fokus terlihat dengan outline 2px `primary-600`.

### 5.13 Formulir

- Label selalu di atas input.
- Pesan kesalahan di bawah input dengan ikon dan teks.
- Nominal rupiah diformat dengan pemisah titik (contoh: Rp 5.000.000).

---

## 6. Pola Layout

### 6.1 Verifikasi Publik
Header sederhana, kolom kode unik di tengah, hasil di bawah: badge, penanda langkah, timeline, dan kartu hash harian. Tanpa navigasi.

### 6.2 Dasbor Amil
Sidebar: Pos Dana, Penerimaan, Penyaluran, Papan Silang. Ringkasan kartu saldo tiga angka di bagian atas. Tombol "Buat penyaluran" di kanan atas.

### 6.3 Antrean Penyetuju
Daftar penyaluran berstatus Dikonfirmasi dari unit lain. Setiap item menampilkan penanda langkah dan tombol persetujuan.

### 6.4 Konfirmasi Mustahik
Layout satu kolom, lihat bagian 5.4.

### 6.5 Papan Silang
Halaman publik tanpa login, lihat bagian 5.7.

---

## 7. Gerak

- Durasi transisi 150 sampai 250 milidetik, easing `cubic-bezier(0.2, 0, 0, 1)`.
- Hormati `prefers-reduced-motion`.
- Tidak ada animasi berulang.

---

## 8. Nada Bahasa

| Hindari | Gunakan |
| --- | --- |
| "Oops, ada masalah!" | "Penyaluran belum dapat disetujui." |
| "Hore, berhasil!" | "Penyaluran sudah tersalurkan dan tercatat." |
| "Klik di sini" | "Lihat kesaksian" |
| "Hash tidak valid" | "Catatan ini tidak cocok dengan kesaksian lembaga lain. Pelajari lebih lanjut." |
| "Error 400" | "Data belum lengkap. Periksa kembali nominal." |
| "Dana sudah sampai" | "Penerima sudah mengonfirmasi penerimaan." |

Jangan pernah menulis bahwa sistem membuktikan dana sudah sampai. Tulis apa yang tercatat dan dikonfirmasi.

---

## 9. Aksesibilitas

- Semua elemen interaktif dapat diakses keyboard.
- Gambar bukti memiliki teks alternatif.
- Tabel papan silang memiliki header yang terhubung dengan sel.
- Target sentuh minimal 44 x 44 piksel.
- Halaman konfirmasi diuji di ponsel layar kecil dan dengan teks diperbesar.

---

## 10. Token Siap Pakai

```css
:root {
  --zaky-primary-700: #0F5C4D;
  --zaky-primary-600: #137A66;
  --zaky-primary-100: #D7F0E8;
  --zaky-accent-500: #C8962E;
  --zaky-accent-100: #F7EDD6;
  --zaky-neutral-900: #14201D;
  --zaky-neutral-600: #4B5A56;
  --zaky-neutral-300: #C9D3D0;
  --zaky-neutral-50: #F6F8F7;
  --zaky-surface: #FFFFFF;

  --zaky-status-dibuat: #EEF2F7;
  --zaky-status-menunggu: #FDF3DC;
  --zaky-status-ditolak: #FBE4E4;
  --zaky-status-dikonfirmasi: #E6EEF8;
  --zaky-status-tersalurkan: #D7F0E8;
  --zaky-status-peringatan: #FFF1E0;

  --zaky-radius-card: 12px;
  --zaky-radius-button: 10px;
  --zaky-radius-input: 8px;
  --zaky-shadow-card: 0 1px 2px rgba(20,32,29,0.06), 0 4px 12px rgba(20,32,29,0.04);

  --zaky-font-sans: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --zaky-font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

---

## 11. Checklist Sebelum Rilis

- [ ] Semua kombinasi warna lolos uji kontras
- [ ] Setiap status memiliki ikon dan teks
- [ ] Kartu saldo tiga angka menampilkan invariant dengan benar
- [ ] Penanda langkah tiga pihak tampil di setiap detail penyaluran
- [ ] Tombol persetujuan menjelaskan alasan jika tidak aktif
- [ ] Papan silang menampilkan keempat status dengan benar
- [ ] Halaman konfirmasi diuji di ponsel
- [ ] Mode gelap diuji
- [ ] Skor Lighthouse aksesibilitas minimal 90
