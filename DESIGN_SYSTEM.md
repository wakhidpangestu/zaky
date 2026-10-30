# Design System Zaky — Tema Neon Onyx

Dokumentasi resmi sistem desain antarmuka dan visual untuk **Zaky (Jaringan Verifikasi Penyaluran Zakat Antarlembaga)**. Sistem desain ini merujuk pada spesifikasi resmi Bagian G (*Design Brief*) dan Bagian VI (*UI/UX Preview*) dari Proposal Karya Web Development Competition UINIC 8.0 (HMPS Informatika UIN Sunan Kalijaga).

---

## 1. Filosofi Desain

Sistem desain Zaky dirancang dengan bahasa visual **Neon Onyx**—perpaduan antara kedalaman hitam mutlak (*onyx*), permukaan panel modern (*subtle dark surface*), serta aksen hijau neon bercahaya (*vibrant neon green*) yang melambangkan transparansi, presisi, dan integritas kriptografis data zakat.

Filosofi inti yang melandasi setiap komponen antarmuka:

1. **Bukti Sebelum Keindahan (Proof Over Ornamentation)**  
   Setiap elemen visual dirancang untuk memperjelas integritas data. Hash kriptografis, rantai audit, status kesaksian, dan kode verifikasi memiliki keterbacaan tertinggi, bukan disembunyikan.
2. **Gagal Harus Terlihat (Fail-Closed & Visibly Obvious)**  
   Data yang terindikasi manipulasi, ketidakcocokan hash antarlembaga, atau pelanggaran invariant saldo tidak pernah ditampilkan tersamar. Status peringatan dan bahaya memakai palet oranye-merah dengan kontras tinggi dan deskripsi verbal eksplisit.
3. **Kedalaman Onyx dan Fokus Neon (Depth & Luminescence)**  
   Latar hitam onyx (`#000000`) menghilangkan distraksi visual dan menghemat konsumsi daya layar OLED/AMOLED, sementara aksen hijau neon (`#2FE92B`) mengarahkan fokus pengguna langsung ke aksi penting dan indikator keabsahan.
4. **Kaca Hanya untuk Elemen Melayang (Selective Glassmorphism)**  
   Efek *backdrop blur* dan transparansi kaca hanya digunakan untuk elemen yang benar-benar mengambang di atas konten (bilah navigasi, modal akad, laci tugas *slide-over*).
5. **Gerak Adalah Informasi (Functional Motion)**  
   Animasi dan visualisasi 3D (Three.js + GSAP) mengomunikasikan perjalanan akad dari muzakki ke mustahik. Renderer WebGL secara otomatis berhenti berputar saat adegan diam (*idle-pause*) untuk menghemat CPU/GPU pengguna dan menghormati preferensi `prefers-reduced-motion`.

---

## 2. Identitas Merek

### Logomark (Kufi Geometris)
Logo karya Zaky adalah tanda grafis (*logomark*) berbentuk modul geometris terstruktur yang menyerupai seni kaligrafi **Kufi Murabba' (geometris)**, membentuk komposisi huruf-huruf **Z-A-K-Y**.
- **Makna Simbolis:** Bentuk modul yang tegas dan saling mengunci (*interlocking modules*) melambangkan konsensus antarlembaga zakat yang saling memvalidasi dan menyaksikan catatan transaksi sehingga mustahil diubah secara sepihak.
- **Warna Logo:** Putih solid (`#FFFFFF`) di atas bidang hijau zamrud, bersanding dengan wordmark tipografis dengan titik hijau neon (`#2FE92B`).

---

## 3. Palet Warna (Neon Onyx Color Tokens)

Sistem warna Zaky menetapkan 6 token warna fundamental dengan kontras tinggi yang memenuhi standar aksesibilitas WCAG AAA untuk keterbacaan data keuangan publik:

| No | Token | Nilai Hex | RGB | Makna & Penggunaan Semantik |
|:---:|:---|:---:|:---:|:---|
| 1 | **Hijau Neon** | `#2FE92B` | `rgb(47, 233, 43)` | **Warna Utama & Aksi:** Identitas Zaky, tombol aksi primer (*CTA*), status terverifikasi/aktif, pendaran fokus (*glow ring*). |
| 2 | **Hitam Onyx** | `#000000` | `rgb(0, 0, 0)` | **Latar Belakang Utama:** Kanvas dasar aplikasi, memberikan kedalaman ruang maksimal dan rasio kontras tak hingga. |
| 3 | **Hitam Abu** | `#0F0F0F` | `rgb(15, 15, 15)` | **Permukaan Kartu & Panel:** Lapisan kontainer konten, kartu bento (*bento grid*), dan bilah sisi (*sidebar*). |
| 4 | **Putih Murni** | `#FFFFFF` | `rgb(255, 255, 255)` | **Teks Utama:** Judul halaman (*headings*), label penting, angka nominal primer, keterbacaan mutlak di atas latar gelap. |
| 5 | **Abu Kehijauan Pucat** | `#BBCBB2` | `rgb(187, 203, 178)` | **Teks Sekunder & Muted:** Keterangan penjelas, label waktu lampau (*relative time*), deskripsi kartu, dan garis pembatas halus. |
| 6 | **Oranye Peringatan** | `#FF5102`<br>`#FF9821`<br>`#F57733` | `rgb(255, 81, 2)`<br>`rgb(255, 152, 33)`<br>`rgb(245, 119, 51)` | **Aksen Kritis & Bahaya:** Penanda status darurat, ketidakcocokan rantai hash (*tamper detected*), peringatan batas cadangan 72 jam, dan seri grafik data. |

### Token Status Transaksi & Verifikasi

Status transaksi tidak pernah direpresentasikan dengan warna saja; selalu dipasangkan dengan **ikon SVG yang sesuai** dan **teks deskriptif**:

| Status | Warna Latar | Warna Teks | Border | Ikon |
|:---|:---:|:---:|:---:|:---:|
| **Tersalurkan / Cocok** | `rgba(47, 233, 43, 0.12)` | `#2FE92B` | `rgba(47, 233, 43, 0.3)` | `CheckCircle2` |
| **Menunggu Persetujuan** | `rgba(255, 152, 33, 0.12)` | `#FF9821` | `rgba(255, 152, 33, 0.3)` | `Clock` |
| **Draf / Menunggu Saksi** | `rgba(59, 130, 246, 0.12)` | `#60A5FA` | `rgba(59, 130, 246, 0.3)` | `FileEdit` |
| **Tidak Cocok (Manipulasi)** | `rgba(255, 81, 2, 0.15)` | `#FF5102` | `rgba(255, 81, 2, 0.4)` | `AlertTriangle` |
| **Dibatalkan / Kadaluwarsa** | `rgba(187, 203, 178, 0.10)` | `#BBCBB2` | `rgba(187, 203, 178, 0.2)` | `XCircle` |

---

## 4. Sistem Tipografi

Tipografi Zaky memadukan tipografi modern berkarakter humanis untuk komunikasi umum, dengan jenis huruf proporsional monospasi untuk presisi data teknis:

```
┌────────────────────────────────────────────────────────┐
│  Plus Jakarta Sans   Aa Bb Cc Dd 1 2 3 4 5 6 7 8 9 0   │  UI, Judul & Teks Penjelas
│  JetBrains Mono      0x7f.. SHA-256 ZK8E9PGFHQMQ  Rp   │  Hash, Kode & Angka Finansial
└────────────────────────────────────────────────────────┘
```

### 1. Huruf Utama: Plus Jakarta Sans
- **Kegunaan:** Seluruh antarmuka, judul (*headings*), label tombol, navigasi, dan dokumen tanda terima resmi.
- **Karakteristik:** Geometris modern dengan bukaan huruf lebar (*wide aperture*), sangat nyaman dibaca pada layar monitor maupun perangkat seluler kecil.
- **Bobot yang Digunakan:**
  - `Regular (400)`: Teks paragraf dan deskripsi bantuan.
  - `Medium (500)`: Teks antarmuka, input form, dan tab navigasi.
  - `SemiBold (600)`: Sub-judul, kartu ringkasan, dan tombol tindakan.
  - `Bold (700 / 800)`: Judul utama halaman (*display headings*) dan angka KPI utama.

### 2. Huruf Teknis: JetBrains Mono
- **Kegunaan:** Hash SHA-256 rantai blok, tanda tangan digital Ed25519, kode verifikasi 12 karakter (contoh: `ZKN6FFJDSYHU`), nominal angka saldo, dan formula invariant basis data.
- **Karakteristik:** Monospasi murni dengan pembeda tegas antara angka `0` (bergaris) dan huruf `O`, serta angka `1` dan huruf `l`/`I` untuk mencegah kesalahan audit manual.

### Skala Tipografi (Type Scale)

| Tingkat | Ukuran (Desktop) | Ukuran (Mobile) | Bobot | Tracking | Line Height |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Display 2XL** | `48px / 3.0rem` | `32px / 2.0rem` | Bold (800) | `-0.03em` | 1.15 |
| **Display XL** | `36px / 2.25rem` | `28px / 1.75rem` | Bold (700) | `-0.025em` | 1.2 |
| **Heading LG** | `24px / 1.5rem` | `20px / 1.25rem` | SemiBold (600) | `-0.02em` | 1.3 |
| **Heading MD** | `18px / 1.125rem` | `16px / 1.0rem` | SemiBold (600) | `-0.015em` | 1.35 |
| **Body Standard** | `15px / 0.9375rem` | `14px / 0.875rem` | Regular (400) | `-0.01em` | 1.5 |
| **Body Small** | `13px / 0.8125rem` | `12px / 0.75rem` | Medium (500) | `0em` | 1.45 |
| **Mono Technical** | `13px / 0.8125rem` | `12px / 0.75rem` | Regular (400) | `0em` | 1.4 |

---

## 5. Tata Letak dan Komponen (Bento Grid Architecture)

### 1. Pola Tata Letak Bento Grid
Antarmuka dasbor amil, konsol persetujuan, dan papan silang publik menggunakan arsitektur **Bento Grid**:
- Modul-modul informasi tersusun dalam grid modular fleksibel (12 kolom pada desktop, responsif menjadi 1-2 kolom pada layar sempit).
- Setiap modul dibatasi permukaan `#0F0F0F` dengan garis tepi (*subtle border*) `rgba(255, 255, 255, 0.08)`.
- Sudut modul membulat (*rounded corners*) dengan radius `1.0rem` hingga `1.25rem`.

### 2. Hierarki Permukaan (Z-Index & Surface Depth)

```
[ Lapis 3: Modal & Drawer ] ─── #0F0F0F + Backdrop Blur (16px) + Neon Glow Ring
        ▲
[ Lapis 2: Kartu & Panel  ] ─── #0F0F0F + Border rgba(255,255,255,0.08)
        ▲
[ Lapis 1: Kanvas Halaman ] ─── #000000 (Hitam Onyx Mutlak)
```

### 3. Komponen Utama

#### A. Tombol Aksi (Buttons)
- **Primary CTA:** Latar hijau neon (`#2FE92B`), teks hitam pekat (`#000000`), bobot font SemiBold. Pada saat diarahkan (*hover*), memancarkan pendaran lembut (*box-shadow: 0 0 20px rgba(47, 233, 43, 0.45)*).
- **Secondary / Ghost:** Latar transparan atau `rgba(255, 255, 255, 0.05)`, border `rgba(255, 255, 255, 0.15)`, teks putih (`#FFFFFF`).
- **Destructive / Danger:** Latar `rgba(255, 81, 2, 0.15)`, teks oranye (`#FF5102`), border `rgba(255, 81, 2, 0.4)`.

#### B. Kartu Pos Dana & Saldo Invariant
Setiap kartu pos dana menyajikan visualisasi empat saldo yang saling mengunci:
1. `Saldo Masuk` (Total seluruh penerimaan terverifikasi)
2. `Saldo Tersedia` (Dana bebas yang siap dialokasikan)
3. `Saldo Dicadangkan` (Dana dalam proses draf/menunggu konfirmasi saksi selama 72 jam)
4. `Saldo Tersalurkan` (Dana yang telah selesai disalurkan kepada mustahik)
- Dilengkapi indikator rumus invariant: `Masuk = Tersedia + Dicadangkan + Tersalurkan`.

#### C. Laci Tugas & Konsol Persetujuan Empat Mata
- Panel samping (*slide-over drawer*) dengan informasi lengkap verifikasi.
- Mencegah *self-approval*: Tombol persetujuan secara otomatis dinonaktifkan dengan pesan peringatan jika petugas penyetuju berasal dari unit yang sama dengan pembuat draf.

#### D. Kanvas Simulasi 3D (Zaky Simulator)
- Dibangun dengan Three.js dan GLSL Shader ramah lingkungan.
- Model gedung kantor lembaga dan meja kerja interaktif (Meja Saksi, Meja Penyetuju, Meja Penerimaan).
- Menggunakan skema warna yang sinkron dengan Neon Onyx (kaca tinted gelap dengan garis pinggir neon hijau).

---

## 6. Penerapan Token dalam Kode (Tailwind CSS 4)

Konfigurasi token dalam CSS Variables:

```css
:root {
  /* Palet Neon Onyx */
  --bg-onyx: #000000;
  --surface-panel: #0F0F0F;
  --surface-panel-hover: #171717;
  --text-primary: #FFFFFF;
  --text-secondary: #BBCBB2;
  
  /* Aksen Utama */
  --accent-neon: #2FE92B;
  --accent-neon-muted: rgba(47, 233, 43, 0.15);
  --accent-neon-glow: rgba(47, 233, 43, 0.4);
  
  /* Aksen Bahaya / Kritis */
  --accent-danger: #FF5102;
  --accent-danger-muted: rgba(255, 81, 2, 0.15);
  --accent-warning: #FF9821;
  --accent-warning-muted: rgba(255, 152, 33, 0.15);

  /* Garis Batas & Pembagi */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: rgba(47, 233, 43, 0.4);
}
```

---

## 7. Standar Aksesibilitas (WCAG AAA)

1. **Rasio Kontras:**
   - Teks Utama (`#FFFFFF`) di atas Latar Onyx (`#000000`): **21 : 1** (Lulus AAA).
   - Teks Sekunder (`#BBCBB2`) di atas Panel (`#0F0F0F`): **9.8 : 1** (Lulus AAA).
   - Aksen Neon (`#2FE92B`) di atas Panel (`#0F0F0F`): **10.5 : 1** (Lulus AAA).
2. **Keterbacaan Non-Warna (Color-Blind Friendly):**
   - Setiap status transaksi dan validitas hash memadukan ikon grafis + teks deskriptif eksplisit + warna status.
3. **Navigasi Papan Ketik (Keyboard Focus):**
   - Setiap elemen interaktif memiliki `focus-visible: ring-2 ring-[#2FE92B]` dengan jarak *offset* yang jelas.
4. **Pengurangan Gerak:**
   - Pengguna dengan setelan sistem `prefers-reduced-motion: reduce` secara otomatis mematikan transisi GSAP dan orbit kamera Three.js.
