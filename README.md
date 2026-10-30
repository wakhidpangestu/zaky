# Zaky — Jaringan Verifikasi Penyaluran Zakat Antarlembaga

<div align="center">

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3-000000?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-000000?style=for-the-badge&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-000000?style=for-the-badge&logo=postgresql&logoColor=336791)](https://www.postgresql.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.186-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-000000?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com/)
[![Lighthouse 100](https://img.shields.io/badge/Lighthouse-100%2F100%2F100-2FE92B?style=for-the-badge&logo=lighthouse&logoColor=black)](https://zakyapp.vercel.app)

<br/>

**Sistem pencatatan dan verifikasi penyaluran zakat terfederasi dengan rantai audit kriptografis, segregasi kewenangan empat mata, dan konsensus kesaksian antarlembaga.**

[**Jelajahi Demo Langsung**](https://zakyapp.vercel.app) • [**Papan Silang Publik**](https://zakyapp.vercel.app/silang) • [**Sistem Desain Neon Onyx**](DESIGN_SYSTEM.md) • [**Repositori GitHub**](https://github.com/wakhidpangestu/zaky)

---

### Tim Veritas — Universitas Indraprasta PGRI (UNINDRA)
Karya resmi untuk **Web Development Competition UINIC 8.0**  
*(HMPS Informatika Universitas Islam Negeri Sunan Kalijaga Yogyakarta)*

| Nama Lengkap | NIM | Peran dalam Tim |
|:---|:---:|:---|
| **Wakhid Pangestu** | `202443500833` | Ketua Tim & Arsitek Sistem |
| **Ahmad Dandi Subhani** | `202343500126` | Anggota Tim & Pengembang Antarmuka |
| **Rendy Setiawan** | `202343501763` | Anggota Tim & Pengembang Backend / Data |

</div>

---

## Daftar Isi
- [Latar Belakang dan Masalah](#latar-belakang-dan-masalah)
- [Solusi dan Prinsip Utama](#solusi-dan-prinsip-utama)
- [Diagram Arsitektur Sistem](#diagram-arsitektur-sistem)
  - [1. Arsitektur Berlapis (Layered Architecture)](#1-arsitektur-berlapis-layered-architecture)
  - [2. Alur Konsensus & Kesaksian Silang Antarlembaga](#2-alur-konsensus--kesaksian-silang-antarlembaga)
  - [3. Siklus Hidup Segregasi Empat Mata](#3-siklus-hidup-segregasi-empat-mata)
- [Aturan Fikih dan Kepatuhan Regulasi](#aturan-fikih-dan-kepatuhan-regulasi)
- [Fitur Utama](#fitur-utama)
- [Design System (Tema Neon Onyx)](#design-system-tema-neon-onyx)
- [Hasil Pengujian dan Audit Kualitas](#hasil-pengujian-dan-audit-kualitas)
- [Tumpukan Teknologi (Tech Stack)](#tumpukan-teknologi-tech-stack)
- [Panduan Memulai Cepat (Quickstart)](#panduan-memulai-cepat-quickstart)
- [Batasan Karya dan Peta Jalan](#batasan-karya-dan-peta-jalan)

---

## Latar Belakang dan Masalah

Zakat adalah instrumen keuangan sosial Islam yang berpotensi besar mengentaskan kemiskinan dan ketimpangan ekonomi umat. Namun, efektivitas pengumpulan dan pendistribusian dana zakat sangat bergantung pada satu faktor fundamental: **kepercayaan muzakki (pemberi zakat)** bahwa dana yang diserahkan benar-benar sampai kepada mustahik yang berhak sesuai syariat.

Berdasarkan analisis proposal karya, dua persoalan sistemis di lapangan melahirkan krisis kepercayaan:
1. **Catatan internal mudah diubah tanpa jejak:** Penyaluran lazim dicatat dalam spreadsheet atau dokumen laporan berkala yang diunggah ke situs web. Publik dan muzakki tidak memiliki sarana teknis untuk membuktikan apakah riwayat catatan tersebut pernah disunting atau dimanipulasi di kemudian hari.
2. **Tidak ada salinan pembanding di luar lembaga (*Single Point of Truth*):** Lembaga zakat beroperasi sebagai pulau informasi terisolasi. Ketika terjadi perubahan angka penyaluran, tidak ada pihak ketiga atau lembaga sejawat (*peer institutions*) yang memegang salinan kriptografis sebagai pembanding.

Kepercayaan publik selama ini bertumpu sepenuhnya pada **reputasi**, bukan pada **bukti yang dapat diverifikasi (*proof-based accountability*)**.

---

## Solusi dan Prinsip Utama

Zaky memindahkan fondasi kepercayaan dari sekadar reputasi ke **kriptografi dan konsensus federasi antarlembaga**. Setiap lembaga zakat berizin menjalankan instansinya sendiri dengan basis data independen, namun saling mengunci catatan melalui protokol kesaksian harian.

Lima pilar penegakan integritas Zaky:

1. **Segregasi Empat Mata (*4-Eyes Principle*):**  
   Pembuat draf (amil), saksi independen (dua saksi lapangan atau mustahik berponsel), dan penyetuju keuangan wajib merupakan individu dan unit kerja yang berbeda. Aturan ini dikunci di lapisan basis data PostgreSQL melalui stored procedure dan constraint, bukan sekadar tata tertib operasional.
2. **Invariant Saldo Anti-Defisit (*Strict Mathematical Invariant*):**  
   Setiap pos dana wajib memenuhi formula kekal:
   $$\text{Total Masuk} = \text{Saldo Tersedia} + \text{Saldo Dicadangkan} + \text{Total Tersalurkan}$$
   Saldo otomatis dicadangkan (*reserved*) sejak tahap draf dibuat, sehingga dana yang sama mustahil disalurkan ganda (*double-spending*).
3. **Rantai Hash Append-Only (SHA-256 + RFC 8785 JCS):**  
   Setiap peristiwa keuangan di-serialize secara deterministik mengikuti *JSON Canonicalization Scheme* (RFC 8785) dan dirantai hash SHA-256 ke peristiwa sebelumnya. Pemicu (*trigger*) basis data menolak keras aksi `UPDATE` dan `DELETE`.
4. **Konsensus Kesaksian Silang (Ed25519 Signed Witnessing):**  
   Pada akhir hari operasional, kepala rantai transaksi diringkas menjadi satu hash harian, ditandatangani secara digital dengan kunci privat Ed25519 (RFC 8032), lalu disaksikan dan disimpan oleh lembaga rekanan (Lembaga B dan C) di **Papan Silang**. Pemilik server tidak dapat menulis ulang sejarah masa lalu tanpa terdeteksi sebagai "Tidak cocok" di hadapan publik.
5. **Verifikasi Publik Terbuka & Ramah Privasi:**  
   Siapa pun dapat memeriksa keaslian penyaluran menggunakan kode acak 12 karakter atau pindaian QR pada bukti cetak tanpa perlu mendaftar akun. Data sensitif mustahik tetap terlindungi dengan anonimisasi HMAC-SHA256 sesuai mandat UU PDP No. 27/2022.

---

## Diagram Arsitektur Sistem

### 1. Arsitektur Berlapis (Layered Architecture)

Arsitektur Zaky dibangun dengan paradigma *fail-closed* di mana seluruh aturan validasi keuangan hidup di lapisan basis data paling bawah sehingga tidak dapat ditembus oleh kesalahan aplikasi.

```mermaid
flowchart TD
    subgraph Klien["Lapisan Pengguna & Klien"]
        Muzakki["Muzakki & Publik<br/>(Verifikasi Kode & Papan Silang)"]
        Amil["Petugas Amil<br/>(Penerimaan & Draf Penyaluran)"]
        Penyetuju["Petugas Penyetuju<br/>(Otorisasi Lintas Unit)"]
    end

    subgraph Presentasi["Lapisan Presentasi (Next.js 16 App Router & React 19)"]
        PublicRoute["Rute Publik: /publik, /verifikasi, /silang"]
        OfficeMode["Mode Standar: Dasbor Kartu Bento (dnd-kit)"]
        Office3D["Mode Simulator: Kantor Digital 3D (Three.js + GSAP)"]
        DesignSys["Tema Neon Onyx (Tailwind CSS 4 & Lucide Icons)"]
    end

    subgraph Aplikasi["Lapisan Aplikasi (Server Actions & Route Handlers)"]
        AuthModule["Autentikasi Sesi JWT HS256 (jose)"]
        JCSModule["Kanonikalisasi JSON RFC 8785 (JCS)"]
        CryptoModule["Tanda Tangan Ed25519 & Hash SHA-256"]
        RealtimeModule["Server-Sent Events (SSE) + Fallback Polling 10s"]
        RateLimiter["Proteksi Token Bucket & Idempotency Lock"]
    end

    subgraph DataDomain["Lapisan Domain & Data (PostgreSQL 16)"]
        SPCore["Stored Procedures PL/pgSQL:<br/>- catat_penerimaan()<br/>- buat_draf_penyaluran()<br/>- selesaikan_penyaluran()"]
        CheckConst["CHECK Constraints:<br/>- Invariant 4 Saldo<br/>- Hak Amil <= 12.50%<br/>- 8 Asnaf QS At-Taubah:60"]
        AuditLog["Rantai Audit Append-Only<br/>(Trigger Menolak UPDATE / DELETE)"]
        RLS["Row Level Security (RLS)<br/>Deny-by-default untuk Peran Publik"]
    end

    Klien --> Presentasi
    Presentasi --> Aplikasi
    Aplikasi --> DataDomain
```

---

### 2. Alur Konsensus & Kesaksian Silang Antarlembaga

Setiap hari operasional ditutup dengan pertukaran bukti kriptografis antarlembaga independen:

```mermaid
sequenceDiagram
    autonumber
    participant A as Lembaga Zakat A
    participant B as Lembaga Saksi B
    participant C as Lembaga Saksi C
    participant PS as Papan Silang Publik
    participant Pub as Muzakki / Publik

    Note over A: Tutup Buku Harian (Cron)
    A->>A: Hitung SHA-256 kepala rantai dengan format RFC 8785 (JCS)
    A->>A: Tandatangani hash dengan Kunci Privat Ed25519 (Lembaga A)
    A->>B: Kirim Ringkasan Hash Harian Lembaga A
    A->>C: Kirim Ringkasan Hash Harian Lembaga A
    
    Note over B,C: Validasi Independen
    B->>B: Verifikasi tanda tangan digital Ed25519 Lembaga A
    B-->>A: Kirim Kesaksian Bertanda Tangan Ed25519 Lembaga B
    C->>C: Verifikasi tanda tangan digital Ed25519 Lembaga A
    C-->>A: Kirim Kesaksian Bertanda Tangan Ed25519 Lembaga C

    A->>PS: Publikasikan Hash Harian + Kesaksian B & C
    
    Note over Pub,PS: Verifikasi Publik Tanpa Perantara
    Pub->>PS: Periksa Status Keabsahan Lembaga A
    alt Catatan Utuh & Sesuai
        PS-->>Pub: Tampil "Cocok" (Hash Log == Kesaksian Peer B & C)
    else Terjadi Manipulasi Catatan di Database A
        PS->>PS: Hitung ulang rantai log saat itu juga
        PS-->>Pub: Tampil "Tidak Cocok" (Peringatan Merah Manipulasi Terdeteksi!)
    end
```

---

### 3. Siklus Hidup Segregasi Empat Mata

Alur penyaluran zakat mewajibkan keterlibatan multi-aktor untuk mencegah penggelapan dana maupun penyaluran fiktif:

```mermaid
flowchart LR
    A["1. Penerimaan Dana"] -->|"Alokasi Pos & Asnaf<br/>Hak Amil <= 12.50%"| B["2. Draf Penyaluran"]
    B -->|"Sistem Cadangkan Saldo<br/>(Kunci 72 Jam)"| C["3. Konfirmasi Penerima"]
    C -->|"Penerima Klik Token HP /<br/>2 Saksi Lapangan"| D["4. Persetujuan Keuangan"]
    D -->|"Wajib Unit Berbeda<br/>(Pencegahan Self-Approval)"| E["5. Eksekusi Penyaluran"]
    E -->|"Saldo Dicadangkan -> Tersalurkan<br/>Rantai SHA-256 Terkunci"| F["6. Terbit Bukti & QR"]
```

---

## Aturan Fikih dan Kepatuhan Regulasi

Sistem Zaky mengonversikan kaidah hukum Islam dan hukum positif Indonesia langsung ke dalam logika perangkat lunak:

1. **8 Golongan Asnaf (QS At-Taubah ayat 60):**  
   Pos dana dan peruntukan mustahik dikunci dalam `ENUM` basis data: `FAKIR`, `MISKIN`, `AMIL`, `MUALLAF`, `RIQAB`, `GHARIMIN`, `FISABILILLAH`, dan `IBNU_SABIL`. Penyaluran ditolak jika asnaf draf tidak cocok dengan asnaf mustahik terdaftar.
2. **Batasan Hak Amil Maksimal 12,50%:**  
   Sesuai fatwa dan regulasi zakat Indonesia, hak amil dibatasi maksimal seperdelapan (12,50%) dari total penerimaan dan dihitung otomatis oleh stored procedure PostgreSQL.
3. **Kepatuhan UU Pengelolaan Zakat (UU No. 23 Tahun 2011):**  
   Menjamin prinsip transparansi dan akuntabilitas pengelolaan dana umat dengan audit berkala yang dapat dibuktikan oleh publik.
4. **Kepatuhan UU Perlindungan Data Pribadi (UU No. 27 Tahun 2022):**  
   Identitas privat mustahik (seperti NIK dan nomor ponsel) tidak disimpan telanjang pada catatan publik. Penyamaran dilakukan dengan HMAC-SHA256, sehingga privasi dan martabat penerima manfaat tetap terjaga seutuhnya.

---

## Fitur Utama

- **Dua Mode Kerja Sinkron (Data Ganda Nol):**
  - **Mode Standar:** Dasbor kartu responsif bergaya Bento Grid dengan kemampuan susun ulang kartu (*drag-and-drop* dnd-kit).
  - **Zaky Simulator (3D Virtual Office):** Simulasi kantor digital tiga dimensi berbasis Three.js + GSAP dengan meja kerja interaktif (Meja Saksi, Meja Penyetuju, Layar Catatan). Mode dapat diganti sewaktu-waktu tanpa kehilangan konteks.
- **Workflow Kantor Bersama Real-Time:**  
  Antrean pekerjaan (*work items*) terpusat dari basis data, sistem klaim tugas (*take ownership*), serah terima tugas berjejak (*handover audit trail*), dan pembaruan langsung menggunakan Server-Sent Events (SSE) dengan cadangan *smart-polling* 10 detik.
- **Papan Silang Konsistensi Jaringan:**  
  Menampilkan matriks kesaksian silang antarlembaga (Lembaga A, B, dan C), dilengkapi simulator serangan manipulasi (*tamper attack simulator*) untuk mendemonstrasikan secara nyata bagaimana kecurangan internal langsung terdeteksi.
- **Halaman Verifikasi Publik Instan:**  
  Pengecekan keaslian kode transaksi 12 karakter tanpa login, status pencadangan dana, verifikasi bukti PDF, dan kode QR fisik.
- **Unggahan Bukti Aman:**  
  Pemeriksaan MIME-type ketat, validasi *magic signature* berkas, serta pencatatan hash SHA-256 berkas lampiran dengan kuota maksimal 5 MB.

---

## Design System (Tema Neon Onyx)

Zaky menggunakan tema visual **Neon Onyx** yang modern dan berkarakter teknologi tinggi, memadukan latar gelap pekat dengan aksen hijau neon bercahaya untuk keterbacaan data maksimal:

| Token Desain | Nilai Warna | Peran Semantik |
|:---|:---:|:---|
| **Hijau Neon** | `#2FE92B` | Warna utama Zaky, aksi primer (CTA), status aktif/cocok, pendaran fokus (*glow*). |
| **Hitam Onyx** | `#000000` | Latar belakang dasar halaman, memberikan kedalaman ruang dan efisiensi energi. |
| **Hitam Abu** | `#0F0F0F` | Permukaan panel kartu (*bento card*), bilah sisi (*sidebar*), dan wadah dialog. |
| **Putih Murni** | `#FFFFFF` | Teks judul utama dan angka nominal penting (rasio kontras 21:1 terhadap onyx). |
| **Abu Kehijauan Pucat** | `#BBCBB2` | Teks sekunder, label pembantu, dan garis pembatas halus (*subtle border*). |
| **Oranye Bahaya** | `#FF5102` / `#FF9821` | Penanda peringatan kritis, batas kadaluwarsa cadangan 72 jam, dan status manipulasi. |

**Tipografi Resmi:**
- **Plus Jakarta Sans:** Huruf antarmuka utama, judul, navigasi, dan dokumen resmi.
- **JetBrains Mono:** Huruf teknis untuk kode verifikasi 12 karakter, hash SHA-256, tanda tangan Ed25519, dan kalkulasi saldo.

> Untuk pedoman lengkap token warna, komponen, dan standar WCAG AAA, baca [**DESIGN_SYSTEM.md**](DESIGN_SYSTEM.md).

---

## Hasil Pengujian dan Audit Kualitas

Pengujian Zaky mencakup pengujian teknis otomatis komprehensif pada level basis data, kriptografi, integrasi, dan performa peramban:

### 1. Uji Otomatis Suite (103 Pengujian Kantor)
Semua pengujian pada build final lulus **100% tanpa kegagalan (0 failed)**:

```bash
# Menjalankan 11 berkas uji modul kantor bersama
npm run test:office

# Menjalankan seluruh suite pengujian (domain, kripto, rantai, serangan)
npm run test:all
```

- **103 Checks `test:office` Lulus:** Menguji validitas kontrak API, *claim/release* tugas, pencegahan *deadlock* SQL, RBAC per peran, serta integritas sesi.
- **Uji Konkurensi Saldo:** Simulasi draf paralel yang melebihi batas saldo membuktikan bahwa invariant saldo tidak dapat dibobol oleh *race-condition*.
- **Uji Simulasi Manipulasi Log:** Perubahan data pada baris log lama langsung mematahkan rantai SHA-256 dan terdeteksi seketika oleh verifikator SQL maupun TypeScript.

### 2. Audit Skor Google Lighthouse (30 Oktober 2026)

Pengujian performa pada URL produksi (`https://zakyapp.vercel.app`) menghasilkan skor istimewa:

| Kategori Audit | Skor Desktop | Skor Mobile | Target Evaluasi | Status |
|:---|:---:|:---:|:---:|:---:|
| **Accessibility (A11y)** | **100** / 100 | **100** / 100 | Standar WCAG AAA | Terverifikasi |
| **Best Practices** | **100** / 100 | **100** / 100 | Keamanan Web Modern | Terverifikasi |
| **Search Engine Optimization (SEO)** | **100** / 100 | **100** / 100 | Meta OpenGraph & Robot | Terverifikasi |
| **Performance** | **98** / 100 | **91 – 97** / 100 | FCP 0.6s, LCP 0.6s, TBT 0ms | Terverifikasi |

---

## Tumpukan Teknologi (Tech Stack)

| Kategori | Teknologi | Spesifikasi / Keterangan |
|:---|:---|:---|
| **Kerangka Utama** | Next.js 16.4.3 | App Router, React Server Components (RSC), Turbopack |
| **Library UI** | React 19.3 | React DOM, Server Actions |
| **Bahasa Pemrograman** | TypeScript 5 | Strict Mode, Type Safety Penuh |
| **Desain & Gaya** | Tailwind CSS 4 | Desain responsif bertema Neon Onyx, Lucide Icons |
| **Visualisasi 3D** | Three.js 0.186 + GSAP | Animasi akad dan kantor virtual 3D interaktif |
| **Basis Data** | PostgreSQL 16 | Stored Procedure PL/pgSQL, Trigger Audit, Pgcrypto |
| **Kriptografi** | Node.js Crypto Core | Ed25519 (RFC 8032), SHA-256, RFC 8785 (JCS) |
| **Manajemen Sesi** | Jose (JWT HS256) | Cookie `httpOnly`, `sameSite=lax`, proteksi CSRF |
| **Pengujian** | Node Test Runner | `node:test`, PGlite (PostgreSQL WASM), Playwright |
| **Infrastruktur Deploy** | Vercel (Edge/Serverless) | Region `sin1` (Singapura), Cron harian penerbitan hash |

---

## Panduan Memulai Cepat (Quickstart)

### Prasyarat
- **Node.js:** Versi 20.x atau lebih baru.
- **Docker & Docker Compose** (untuk basis data PostgreSQL lokal) atau akun **Supabase**.

### 1. Kloning Repositori & Pasang Dependensi
```bash
git clone https://github.com/wakhidpangestu/zaky.git
cd zaky
npm install
```

### 2. Konfigurasi Variabel Lingkungan
Salin contoh konfigurasi dan lengkapi nilai rahasia:
```bash
cp .env.example .env.local
```

Contoh variabel lingkungan utama pada `.env.local`:
```ini
DATABASE_URL=postgresql://zaky:zakysecret@localhost:5433/zaky_db
JWT_SECRET=rahasia-jwt-minimal-32-karakter-acak-dan-aman!
CRON_SECRET=kunci-rahasia-cron-harian-papan-silang-32-char
APP_URL=http://localhost:3000
OFFICE_WORKFLOW_ENABLED=true
OFFICE_WORKFLOW_DEMO_ACK=true
```

### 3. Menjalankan Basis Data & Aplikasi Lokal
```bash
# Menyalakan PostgreSQL lokal via Docker (migrasi 001-008 otomatis berjalan)
npm run db:up

# Menjalankan server pengembangan Next.js
npm run dev
```
Buka peramban di `http://localhost:3000`.

### Kredensial Akun Evaluasi Juri (Mode Demo)
Untuk kemudahan pengujian fitur, disediakan akun evaluasi siap pakai (kata sandi: `demo123`):

| Alamat Email | Peran (*Role*) | Unit Kerja | Akses Fitur |
|:---|:---:|:---:|:---|
| `budi@lembaga-a.test` | Amil | Pelayanan A | Catat penerimaan, buat draf penyaluran |
| `hari@lembaga-a.test` | Amil | Pendataan B | Saksi independen penyaluran |
| `dewi@lembaga-a.test` | Penyetuju | Keuangan C | Otorisasi pencairan dana penyaluran |
| `rian@lembaga-a.test` | Admin | Kantor Pusat | Monitoring sistem & simulasi serangan |

---

## Batasan Karya dan Peta Jalan

Zaky adalah prototipe fungsional berstandar tinggi yang dikembangkan untuk kompetisi inovasi perangkat lunak:
- **Bukan Lembaga Penyalur Finansial:** Zaky bertindak sebagai sistem verifikasi dan audit pencatatan, tidak menghimpun dana langsung dari masyarakat dan tidak mengelola rekening bank giro.
- **Cakupan Mata Uang:** Versi saat ini difokuskan pada zakat dalam bentuk mata uang Rupiah (IDR).
- **Rencana Pengembangan Lanjutan:**
  1. Integrasi tanda tangan terdesentralisasi antar-server terpisah dengan protokol libp2p.
  2. Implementasi algoritma pendeteksi mustahik ganda (*duplicate mustahik detection*) berbasis *Zero-Knowledge Proofs* (ZKP) agar privasi penerima tetap utuh antarlembaga.
  3. Modul pencatatan wakaf produktif dan zakat fitrah dalam bentuk komoditas beras.

---

## Ucapan Terima Kasih

- **HMPS Informatika Universitas Islam Negeri Sunan Kalijaga Yogyakarta** atas terselenggaranya kompetisi Web Development UINIC 8.0.
- **Program Studi Teknik Informatika Universitas Indraprasta PGRI (UNINDRA)** atas bimbingan dan dukungan akademis.
- Seluruh pegiat transparansi amil zakat di Indonesia.
