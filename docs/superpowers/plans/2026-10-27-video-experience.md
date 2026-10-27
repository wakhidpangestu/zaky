# Video experience implementation plan

> **For agentic workers:** gunakan superpowers:executing-plans; pengguna meminta implementasi langsung pada branch saat ini.

**Goal:** Mengadaptasi seluruh pola video menjadi pengalaman Zaky dengan scene modular dan alur kerja persisten.
**Architecture:** Shared domain SQL + workflow 005; API operasi idempotent; wizard/detail reusable; landing cinematic dan office memakai builder scene yang sama.
**Tech Stack:** Next.js 16.4.3, React, TypeScript, Three.js, pg, PostgreSQL.
**Spec:** `docs/superpowers/specs/2026-10-27-video-reference.md`.

## Global Constraints

Hanya branch `feature/kantor-3d-review`. Pertahankan domain zakat dan fungsi finansial lama. Jangan mengarang data, bukti, pembayaran, pengguna online, rating, atau sertifikasi. `cacheComponents: true` tetap aktif.

## Review Focus

- Retry setelah commit tidak menggandakan saldo/audit.
- Pemilik/aktor berubah peran, tenant, atau versi saat dialog terbuka harus ditolak server.
- Bukti unggahan harus cocok dengan bytes, akun dan tenant, bukan nama file/hash dari klien.
- Perjalanan scroll dan dialog tidak saling mengambil fokus; reduced motion dan WebGL fallback tetap dapat mengakses semua tugas.
- Koneksi putus tidak menghasilkan sukses atau online palsu; aksi belum terkonfirmasi dapat diulang aman.

### Task 1 — Operasi domain dan bukti

**Files:** migration 006, `src/lib/office/operations.ts`, API katalog/record/operasi/bukti, tests operations + SQL.
**Interfaces:** input operasi tervalidasi; response `{id,type,code,status,workItemId}`; katalog pos/mustahik; detail record tenant-scoped.

- [x] Tulis dan jalankan RED parsing nominal/ID/metode, replay, tenant, pemilik/versi dan file signature.
- [x] Implementasi wrapper SQL yang memanggil fungsi finansial lama dalam transaksi.
- [x] Tes penerimaan → draf → dua saksi → approval, saldo, penolakan, rollback, replay, privasi bukti; commit GREEN.

### Task 2 — Wizard dan detail bersama

**Files:** WorkWizard, record detail/receipt, gateway, work queue/panel, halaman penuh.
**Interfaces:** wizard menerima operasi awal; detail menerima ID reference; hasil commit menyegarkan snapshot.

- [x] Wizard lima tahap dengan review, upload nyata, validasi, kegagalan/retry; e-bukti cetak/kalender/QR.
- [x] Buka record tepat dari task; proses saksi/approval sah; semua mode memakai komponen yang sama.
- [x] Hilangkan iframe sebagai jalur kerja kantor; balance memakai sumber backend bila tersedia.

### Task 3 — Scene dan landing sesuai video

**Files:** `src/components/journey/`, `src/lib/office/journey.ts`, landing home, CSS, office scene.
**Interfaces:** progress 0..1 → camera/character/chapter; scene props counts/presence/select/task.

- [x] RED keyframe/route/progress/reduced-motion dan lifecycle.
- [x] Model gedung berfasad lengkung, jalur oranye, cutaway ruang kerja dan karakter berjalan; kamera mengikuti scroll.
- [x] Header kapsul, judul kiri/kartu kontekstual, nav tahap bawah, tracking, layanan, filter peran, preview aplikasi, pilihan mode, trust dan CTA.
- [x] Native keyboard/mobile/reduced motion/WebGL fallback, lazy load dan disposal.

### Task 4 — Verifikasi dan push

- [x] Suite existing, office, SQL, tsc, lint perubahan, production build.
- [ ] Browser dua sesi: wizard validasi/simpan, receipt, handoff, tahap scroll, mobile, dialog fokus, reconnect, fallback.
- [x] Review independen, perbaiki temuan penting dengan tes.
- [x] Update laporan kesesuaian video/QA dan panduan migrasi; siapkan perubahan pada branch aktif.

Status: implementasi, SQL/HTTP, lint perubahan dan build selesai. Uji browser lengkap dan visual akhir terhalang executable Chromium yang tidak tersedia; lihat `docs/06-VIDEO-EXPERIENCE.md`. Push diverifikasi terhadap tree lokal melalui API GitHub pada akhir pekerjaan.
