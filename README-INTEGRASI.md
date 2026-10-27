# Zaky - kantor kerja 3D opsional

## Branch untuk review, bukan main

Repository: `wakhidpangestu/zaky`.
Branch: `feature/kantor-3d-review`.
Basis: `feature/gamifikasi-edukasi-zaky` pada commit `cf097bdc0022b7180fbeede916332a9f7ab173fc`.

Source kantor 3D dari paket sebelumnya disiapkan pada branch terpisah agar dapat diperiksa terlebih dahulu. Tidak ada merge ke main, perubahan branch gamifikasi lama, aktivasi chat, atau migrasi database live. Branch ini menggunakan baseline paket, bukan main terbaru; review konflik/perubahan kolaborator sebelum integrasi ke main.

## Membuka branch di komputer sendiri

Pastikan perubahan lokal sudah disimpan atau di-commit sebelum beralih branch. Jangan memakai reset/force untuk membuang perubahan lokal.

```bash
git fetch origin
git switch --track origin/feature/kantor-3d-review
npm ci
node --experimental-strip-types --test tests/office/*.test.mjs
npm run build
npm run dev
```

Jika branch lokal sudah ada, hentikan server dev dengan **Ctrl+C**, lalu jalankan dari folder proyek:

```bash
git switch feature/kantor-3d-review
git pull --ff-only origin feature/kantor-3d-review
npm ci
npm run build
npm run dev
```

`git pull` memperbarui source dan lockfile; `npm ci` memasang dependency sesuai lockfile. Jalankan kembali `npm ci` setelah update yang mengubah `package.json` atau `package-lock.json`.

### Error `Can't resolve 'qrcode'`

Wizard bersama menggunakan `qrcode@1.5.4`, yang sudah tercantum di `dependencies` dan `package-lock.json`. Error ini berarti paket tidak tersedia pada instalasi yang menjalankan Next.js. Hentikan server dev, jalankan `npm ci` di folder yang berisi `package.json`, lalu mulai ulang dengan `npm run dev`. Jangan menghapus lockfile atau mengganti QR dengan layanan eksternal.

Periksa instalasinya dengan:

```bash
npm ls qrcode
node -p "require.resolve('qrcode')"
```

Buka `http://localhost:3000/dasbor`, login dengan akun demo, lalu pilih Standar atau Kantor 3D. Panduan fitur, dependency, migrasi dan batas verifikasi terbaru ada di [pengalaman video dan pencatatan bersama](docs/06-VIDEO-EXPERIENCE.md). Bagian berikut merekam penyerahan kantor 3D awal, sebelum increment workflow 005 dan operasi 006.

### Windows PowerShell: `npm.ps1` diblokir

Jika `npm ci` gagal dengan `PSSecurityException` atau pesan “running scripts is disabled”, instalasi dependency belum dijalankan. Gunakan `npm.cmd` secara eksplisit, seperti perintah dev yang sudah berhasil pada log Windows. Tidak perlu mengubah Execution Policy atau membuka PowerShell sebagai Administrator.

Hentikan server dev dengan **Ctrl+C**. Dari PowerShell:

```powershell
Set-Location 'C:\Users\Rendy\Documents\GitHub\zaky'
npm.cmd ci
if ($LASTEXITCODE -eq 0) { npm.cmd run dev }
```

`npm.cmd ci` memasang versi dependency sesuai lockfile, termasuk `qrcode`. Server hanya dimulai jika instalasi selesai dengan exit code 0. Jika instalasi gagal, tangani error instalasi tersebut lebih dahulu; menjalankan ulang dev saja tidak memasang paket yang hilang.

Pemeriksaan tambahan, bila diperlukan:

```powershell
npm.cmd ls qrcode
node -p "require.resolve('qrcode')"
```

## Isi perubahan

Empat file existing diganti: `src/app/(amil)/dasbor/page.tsx`, `src/app/(amil)/layout.tsx`, `src/app/(penyetuju)/layout.tsx`, dan `src/app/gamifikasi/page.tsx`. Komponen `src/components/dashboard-3d.tsx` lama tetap ada, tetapi entry baru tidak mengimpornya. Label navbar lama dapat tetap menyebut Jelajah Amanah; route tersebut kini menuju dashboard kerja.

Tambahan: `src/components/office/`, `src/lib/office/`, `src/app/api/office/chat/`, `db/migrations/004_office_chat.sql`, `tests/office/`, `scripts/check-office-syntax.cjs`, dan dokumentasi.

Kantor mempunyai lima workstation, avatar lokal menuju meja, klik objek, kamera orbit/zoom/reset, panel formulir asli, kartu tugas berdasarkan status, navigasi keyboard, fallback grafis, dan chat lembaga opsional. Mode standar tidak mengimpor scene kantor secara statis. Tidak ada XP, skor donasi, atau kewajiban bermain.

## Dokumentasi

- [PRD kantor 3D](docs/01-PRD-KANTOR-3D.md)
- [Flow per role dan task pipeline](docs/02-FLOW-PER-ROLE-DAN-TASK.md)
- [Integrasi dan QA](docs/03-INTEGRASI-DAN-VERIFIKASI.md)
- [Laporan pemeriksaan](docs/04-LAPORAN-PENGUJIAN.md)
- [Ringkasan verifikasi ulang](docs/evidence/review-verification.txt)
- [Konfigurasi chat non-rahasia](docs/office.env.example)

Versi Word sudah diberikan pada lampiran paket percakapan; dokumen yang dapat ditinjau langsung di branch ini adalah versi Markdown.

## Batas penting

Data transaksi tetap memakai store browser repository. Transaksi dan task belum sinkron antarperangkat. Petugas 3D adalah ilustrasi, bukan presence pengguna online. Form keuangan lama masih memiliki perilaku demo dan beberapa pelaku hard-coded. Jangan gunakan data pribadi atau dana nyata.

Chat dimatikan secara default. Source API, UI, dan migrasi tersedia, tetapi database dan pengiriman antarperangkat belum diuji. Aktifkan hanya pada lingkungan demonstrasi setelah membaca runbook; tidak ada secret yang disertakan.

## Verifikasi

Pengujian ulang source overlay: 34 tes lulus (26 perilaku domain + 8 kontrak source), 14 modul lolos parser/transpile, dan strict typecheck model domain exit 0. Ini bukan build Next.js, uji browser, atau suite seluruh repository. Build lengkap, UI/WebGL, lint, SQL, dan integrasi chat tetap harus diperiksa sebelum merge. Tidak ada dependensi baru atau perubahan lockfile pada penyerahan ini.
