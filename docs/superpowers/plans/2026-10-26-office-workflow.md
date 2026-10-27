# Work item, assignment, handoff, dan presence

> **For agentic workers:** Gunakan superpowers:executing-plans; implementasi langsung sesuai instruksi pengguna untuk melanjutkan dan push branch saat ini.

**Goal:** Antrean bersama dari transaksi PostgreSQL dengan kepemilikan persisten dan presence sesi nyata.

**Architecture:** PostgreSQL tetap sumber transaksi. Trigger membuat/memperbarui work item dalam transaksi sumber; perpindahan kepemilikan memakai versi, histori, idempotency, dan pemeriksaan akun/unit dari database. SSE mengirim snapshot terotorisasi dan sinkronisasi ulang setelah reconnect, tanpa broker atau state proses sebagai sumber kebenaran.

**Tech Stack:** Next.js 16.4.3, TypeScript, pg, PostgreSQL, React, Three.js yang sudah ada.

**Spec:** Master prompt Zaky yang dilampirkan pengguna dan scope lanjutan work_item + assignment + handoff + realtime presence; keputusan implementasi dan batas aktual dijabarkan di `docs/05-WORKFLOW-BERSAMA.md`.

## Global Constraints

- Hanya `feature/kantor-3d-review`; jangan force-push atau mengubah main.
- Jangan menyalin transaksi browser menjadi transaksi database atau menganggapnya bukti keuangan.
- Jangan menambah approval penerimaan, role saksi baru, atau mengubah fungsi keuangan/audit yang ada.
- Pertahankan `cacheComponents: true`; tanpa route runtime/dynamic yang tidak kompatibel.
- Login masih demo; fitur database harus diaktifkan eksplisit untuk pengujian dengan secret kuat.

## Review Focus

- Request ulang dengan ID sama dan body berbeda harus konflik; retry identik tidak menggandakan histori.
- Versi lama dan dua claim paralel tidak boleh mengambil alih pekerjaan.
- Akun berubah unit/peran/nonaktif dan lembaga lain tidak boleh melewati pemeriksaan server.
- Kesaksian pertama harus melepas tugas untuk saksi independen berikutnya, meski status penyaluran belum berubah.
- Kehilangan koneksi menghapus indikator kepastian online; snapshot baru menggantikan state lama.

### Task 1: Persistensi dan kebijakan

**Files:** `db/migrations/005_office_workflow.sql`, `src/lib/office/workflow.ts`, `tests/office/workflow.test.mjs`, `tests/office/workflow-db.test.mjs`.

**Interfaces:** WorkItem dengan id, referenceId/type, stage, status, version, owner; `office_assign_work` memvalidasi actor, version, request ID, dan target; `office_sync_penyaluran` hanya mengikuti sumber.

- [x] Tulis dan jalankan tes RED: parsing input, isolasi lembaga, segregasi, terminal, idempotency, histori, rollback, perubahan saksi.
- [x] Implementasi migrasi aditif dan kebijakan murni; uji pada PostgreSQL.
- [x] Commit fondasi setelah tes GREEN.

### Task 2: API dan presence

**Files:** `src/lib/office/workflow-server.ts`, `src/lib/office/http.ts`, routes `work-items`, `presence`, `stream`.

**Interfaces:** GET snapshot antrean; POST assignment `{itemId,version,requestId,action,targetUserId?,reason?}`; heartbeat session UUID dan station; SSE event `snapshot`.

- [x] Tulis tes RED batas JSON, origin, kebijakan input dan heartbeat.
- [x] Implementasi autentikasi DB, error tertutup, heartbeat TTL 60 detik, SSE 25 detik dengan snapshot setiap 3 detik dan revalidasi actor/expiry.
- [x] Jalankan tes dan commit setelah GREEN.

### Task 3: Dua tampilan memakai sumber yang sama

**Files:** hook workflow, work queue, team presence, gateway/use-office-data, office-view, standard-view.

**Interfaces:** hook menyediakan snapshot, status koneksi, mutation yang mempertahankan request ID saat retry; kedua tampilan memakai antrean dan tindakan yang sama.

- [x] Uji adapter antrean sebelum implementasi.
- [x] Hilangkan localStorage sebagai sumber tugas bersama; pertahankan saldo demo yang diberi label.
- [x] Integrasi claim, handoff ke anggota yang memenuhi syarat, release, detail histori, presence nyata; count meja mengikuti antrean server.
- [x] Verifikasi TypeScript, lint file yang diubah, build dan browser.

### Task 4: Verifikasi dan pengiriman

**Files:** dokumentasi PRD/flow/arsitektur/QA dan env contoh.

- [x] Catat audit, cara migrasi/pengaktifan/rollback dan batas formulir keuangan demo.
- [x] Jalankan suite lama, suite office baru, integrasi PostgreSQL, TypeScript, ESLint dan build.
- [x] Review seluruh diff, perbaiki temuan penting dengan tes.
- [ ] Commit dan push ke branch di atas, kemudian verifikasi SHA remote (status final dilaporkan saat pengiriman).
