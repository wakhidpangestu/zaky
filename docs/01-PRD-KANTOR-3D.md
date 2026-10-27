# Kantor kerja 3D Zaky

## Pembaruan increment workflow

Fondasi `work_item + assignment + handoff + realtime presence` diimplementasikan pada branch review. Cakupan aktual, acceptance, aktivasi dan pekerjaan yang belum terimplementasi ada di [05-WORKFLOW-BERSAMA.md](05-WORKFLOW-BERSAMA.md). Bagian berikut mempertahankan visi MVP; bukan pernyataan bahwa seluruh visi sudah selesai. Antrean kini membaca database, sedangkan formulir/saldo lama masih demo browser.

*PRD / 01 | 26 Oktober 2026*

Product requirements, alur per peran, dan task pipeline

Versi 1.0 | 26 Oktober 2026 | Disusun untuk Rendy Setiawan

## Tujuan produk

Mengubah cara mengakses pekerjaan Zaky menjadi kantor virtual isometrik: pengguna memilih meja, membuka alat kerja, memeriksa tugas, dan berkoordinasi dengan tim. Mode standar tetap tersedia tanpa kewajiban bermain. Kedua mode memakai proses dan data yang sama, bukan dua aplikasi keuangan terpisah.

## Pengalaman inti

Masuk akun > pilih Standar atau Kantor 3D > pilih meja > lihat antrean > buka formulir asli > simpan melalui proses yang tersedia > lihat status terbaru di meja penanganan berikutnya. Tiga menu utama di kantor adalah Tugas, Alat, dan Tim.

| Bagian | Status paket ini |
| --- | --- |
| Kantor 3D dan pilihan mode | Source telah dibuat. Belum diuji melalui build aplikasi lengkap atau browser. |
| Task di meja | Proyeksi read-only dari data transaksi simulasi yang sudah digunakan dashboard. |
| Chat antarpengguna | Source API, UI, dan migrasi tersedia; nonaktif secara default dan belum diuji dengan database. |
| Penyerahan untuk review | Branch khusus feature/kantor-3d-review; tidak digabungkan ke main. Lihat README-INTEGRASI.md. |
| Transaksi lintas perangkat | Belum diimplementasikan. Form keuangan lama tetap menggunakan penyimpanan browser. |

## Batas tanggung jawab

Paket ini adalah tambahan source untuk repository wakhidpangestu/zaky, bukan aplikasi mandiri. Target penyerahan adalah branch feature/kantor-3d-review yang dibuat dari feature/gamifikasi-edukasi-zaky pada basis cf097bd. Tidak ada migrasi database atau perubahan main yang dijalankan.

> Makna status: "tersedia di source" tidak sama dengan "lulus pengujian aplikasi". Bagian yang belum tersedia dinyatakan sebagai target lanjutan, bukan fitur yang sudah hidup.

# Pengalaman pengguna dan ruang kerja

*PRD / 02 | 26 Oktober 2026*

## Pilihan mode sejak masuk dashboard

Saat belum memiliki preferensi, tampilkan dua pilihan setara: Mode standar dan Kantor 3D. Simpan pilihan per akun pada browser ini. Pengguna dapat berpindah mode kapan saja; berpindah tidak mengubah transaksi atau memberi skor. Parameter mode pada URL hanya memilih tampilan, bukan memberikan izin.

| Objek 3D | Alat yang dibuka | Fungsi |
| --- | --- | --- |
| Meja Penerimaan | /penerimaan/buat | Memasukkan muzakki, nominal, pos dana, kanal, dan keterangan. |
| Meja Saksi | /penyaluran | Melihat tugas konfirmasi saksi dan membuka record melalui kode. |
| Meja Persetujuan | /persetujuan | Meninjau penyaluran yang sudah terkonfirmasi. |
| Meja Penyaluran | /penyaluran/buat | Menyiapkan draf dan penerima; melihat proses yang menunggu penerima. |
| Layar Catatan | /penyaluran | Melihat riwayat dan status akhir; menu Alat menyediakan papan silang dan verifikasi. |

## Interaksi yang dibuat

Klik meja atau tombol daftar meja untuk memilih area. Avatar lokal bergerak ke meja terpilih; gerakan ini tidak menyelesaikan tugas. Geser untuk memutar kamera, gulir atau cubit untuk zoom, gunakan Reset untuk kembali ke sudut awal. Semua meja memiliki alternatif tombol yang dapat digunakan melalui keyboard.

Daftar tugas menampilkan kode, tujuan, nominal, dan status. Jumlah tugas aktif ditampilkan pada label meja; tumpukan berkas adalah penanda visual, bukan salinan dokumen. Pilih tugas untuk melihat tahap proses lalu buka daftar asli dan cari kode yang sama.

## Panel kerja dan antarmuka sederhana

Formulir dibuka dalam panel same-origin memakai sesi login yang sama. Tombol simpan tetap milik formulir asli. Sebelum panel ditutup, pengguna diminta memastikan isian sudah tersimpan. Tersedia pilihan membuka halaman penuh. Tidak ada inventori, XP, leaderboard, atau misi harian wajib.

> Karakter petugas merupakan ilustrasi fungsi kerja. Mereka bukan bukti bahwa seseorang sedang online. Multiplayer avatar, presence, dan percakapan suara tidak termasuk paket ini.

# Kebutuhan fungsional MVP

*PRD / 03 | 26 Oktober 2026*

Prioritas P0 adalah kebutuhan inti sebelum uji penerimaan. Status berikut menjelaskan cakupan source, bukan hasil uji browser.

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| FR-01 / P0 | Dua mode opsional | Pemakai dapat memilih dan mengganti mode tanpa perubahan saldo. |
| FR-02 / P0 | Standar tanpa game | Entry standar tidak melakukan static import modul Three.js kantor. Verifikasi jaringan browser masih wajib. |
| FR-03 / P0 | Kantor isometrik | Lima workstation dapat dipilih dengan pointer maupun tombol keyboard. |
| FR-04 / P0 | Akses alat asli | Form penerimaan, penyaluran, persetujuan, serta alat publik dibuka dari kantor. |
| FR-05 / P0 | Task dari sumber data | Tugas mengikuti status record, bukan aktivitas avatar atau timer. |
| FR-06 / P0 | Pemisahan peran | Filter tugas memeriksa peran, pembuat, unit, dan saksi yang sudah tercatat. Ini bukan otorisasi server. |
| FR-07 / P0 | Tidak ada duplikasi ledger | Modul 3D tidak menulis saldo atau status transaksi sendiri. |
| FR-08 / P0 | Gagal grafis tetap bekerja | Jika WebGL gagal, daftar meja dan akses mode standar tetap tersedia. |
| FR-09 / P1 | Chat lembaga | Pesan hanya tersedia setelah konfigurasi server dan database; tidak ada pesan dummy. |
| FR-10 / P0 | Status jujur | Tugas batal/ditolak/kedaluwarsa tidak diberi status sukses. Tampilan demo diberi label. |

## Bukan lingkup MVP ini

Tidak ada pembayaran atau transfer nyata, keputusan fikih, sertifikasi lembaga, desa 3D yang dapat dijelajahi, inventori, voice chat, avatar multiplayer, atau sinkronisasi transaksi lintas perangkat. Tahap saksi penerimaan dan pencatat manual terpisah belum ditambahkan ke mesin transaksi.

## Target kualitas setelah integrasi

Uji layar 360 px, tablet, dan desktop; keyboard tanpa mouse; pembesaran teks; pembatalan panel; kehilangan WebGL; dan mode reduced-motion. Scene membatasi pixel ratio sampai 1,5 dan loop sekitar 30 fps, tetapi angka tersebut adalah konfigurasi, bukan hasil benchmark. Latensi, penggunaan memori, dan FPS nyata belum diukur.

# Arsitektur, data, dan komunikasi

*PRD / 04 | 26 Oktober 2026*

## Satu antarmuka kerja di atas proses yang ada

OfficeGateway memilih StandardView atau memuat OfficeView secara dinamis. Scene Three.js hanya mengirim identitas workstation yang dipilih. Adapter tugas membaca store lama dan membentuk OfficeTask. WorkPanel membuka halaman kerja asli; visual 3D tidak membuat transaksi keuangan.

| Lapisan | Sumber kebenaran | Batas saat ini |
| --- | --- | --- |
| Tampilan dan preferensi | State React + preferensi browser | Pilihan mode per akun; bukan pengaturan lintas perangkat. |
| Saldo / penyaluran | src/lib/store.ts dan form lama | Data demo browser; bukan ledger bank atau DB bersama. |
| Antrean meja | Proyeksi status penyaluran | Dihitung ulang, tidak ada tabel task durable atau klaim pekerjaan. |
| Chat opsional | API server + office_messages | Memerlukan migrasi dan akun aktif pada database. |
| Verifikasi / papan silang | Halaman dan API asli repository | Modul kantor tidak mengubah atau menjamin hasil pemeriksaannya. |

## Kontrak chat yang disiapkan

GET menampilkan 60 pesan terakhir untuk lembaga sesi. POST menerima text dan clientId UUID, dengan maksimum 1.000 karakter dan batas body 8 KB. Pemeriksaan origin, akun aktif, lembaga, serta query berparameter dilakukan di server. Pengiriman memakai ID idempotensi dan batas 20 pesan per akun per menit; perilaku database belum diuji.

UI memperbarui pesan melalui polling 5 detik ketika halaman terlihat. Ini bukan WebSocket dan bukan presence. Chat tersedia juga dari mode standar. Pesan tidak mengubah status transaksi, bukan bukti penerimaan, dan tidak boleh memuat data pribadi nyata pada prototipe.

## Batas keamanan yang harus diselesaikan sebelum produksi

Login repository masih memakai akun dan sandi demo yang diketahui publik. Token sesi dan filter peran di UI tidak mengubah keadaan ini. Chat dimatikan secara default dan memerlukan pengakuan mode demo. Sebelum produksi, ganti autentikasi demo, pindahkan mutasi finansial ke server, terapkan pembatasan lembaga pada semua query, dan uji hak akses negatif.

# Penerimaan fitur dan bukti pengujian

*QA / 11 | 26 Oktober 2026*

| Pemeriksaan | Hasil pada paket ini |
| --- | --- |
| 26 tes perilaku domain | Lulus: status, assignment, validasi, deduplikasi, path, input chat, origin, dan unit demo. |
| 8 tes kontrak source | Lulus: import dinamis, cleanup, panel, larangan mutasi saldo, guard chat, dan redirect. Bukan tes browser. |
| 14 modul TS/TSX | Tidak ada error parser/transpile. Dependency-aware typecheck seluruh aplikasi belum dijalankan. |
| Model domain + CSS | Typecheck strict model dan parse CSS lulus pada penyusunan paket. |
| Build / browser / DB | Belum terverifikasi. Registry npm tidak dapat dijangkau pada penyusunan paket akibat kegagalan resolusi DNS. |
| Penyerahan source | Branch review terpisah; bukan merge atau deployment produksi. |

## Skenario wajib sebelum merge

| Uji | Hasil yang harus dibuktikan |
| --- | --- |
| Mode dan sesi | Login; pilih standar/3D; refresh; ganti akun; preference tidak memberi hak tambahan. |
| Scene | Semua objek dan tombol meja bekerja; kamera/zoom/reset, resize, reduced-motion, serta fallback diuji. |
| Form dan sinkronisasi lokal | Input tersimpan dari panel; iframe tidak memuat kantor berulang; menutup tanpa simpan memunculkan peringatan. |
| Task dan peran | Status berpindah meja; creator/same-unit tidak mendapat assignment saksi/approval; terminal bukan sukses. |
| Chat di lingkungan uji | Dua sesi menerima pesan lembaga sama; lembaga lain, tanpa login, origin salah, dan akun nonaktif ditolak. |
| Pengulangan dan konflik | POST sama tidak menambah duplikat; ID sama dengan isi lain ditolak; rate-limit bekerja. |

## Keputusan rilis

Belum layak dinyatakan siap produksi. Source telah ditinjau sendiri, bukan melalui reviewer independen. Uji unit yang lulus tidak membuktikan form asli, scene WebGL, migrasi, atau multi-user workflow berfungsi end-to-end. Jangan merge atau mengiklankan dukungan transaksi antarperangkat berdasarkan paket ini saja.

# Integrasi, rollback, dan referensi

*HANDOFF / 12 | 26 Oktober 2026*

## Cara menggunakan paket source

Paket berupa overlay untuk checkout repository yang sesuai, bukan pengganti seluruh repo. Tinjau diff sebelum menyalin. File existing yang diganti: dashboard page, layout amil, layout penyetuju, dan page gamifikasi lama. Folder office, endpoint chat, tes, dokumentasi, dan migrasi merupakan tambahan.

```bash
npm ci
node --experimental-strip-types --test tests/office/*.test.mjs
node scripts/check-office-syntax.cjs
npm run build
npm run dev
```

Perintah npm dijalankan pada repository lengkap setelah overlay diintegrasikan. Buka /dasbor, bukan halaman kuis lama. Build penuh dan suite existing tetap harus diuji. Jangan menganggap error existing aman hanya karena modul office tidak memunculkan error sintaks.

## Chat opsional: hanya lingkungan demonstrasi

Siapkan database uji dengan skema dan seed yang sesuai. Terapkan 004_office_chat.sql secara manual setelah meninjau izin role database. Gunakan APP_URL dengan origin yang sama, JWT_SECRET acak kuat, koneksi server DATABASE_URL, OFFICE_CHAT_ENABLED=true, dan OFFICE_CHAT_DEMO_ACK=true. Jangan gunakan nilai rahasia contoh atau membuka data nyata melalui akun demo.

## Rollback

Kembalikan empat file existing melalui version control dan hilangkan import office dari entry. Matikan flag chat. Jangan menjatuhkan tabel atau menghapus pesan tanpa persetujuan dan cadangan. Migrasi chat tidak mengubah tabel atau fungsi finansial existing.

## Acuan repository yang diperiksa

Basis: wakhidpangestu/zaky, feature/gamifikasi-edukasi-zaky, cf097bdc0022b7180fbeede916332a9f7ab173fc. Acuan: README.md; Zaky-PRD-v4.md; Zaky-Design-System-v3.md; src/lib/store.ts; src/app/actions/auth.ts; layout, dashboard, penerimaan, penyaluran, persetujuan; db/migrations/001_initial_schema.sql dan 002_seed_demo.sql.

PR existing: https://github.com/wakhidpangestu/zaky/pull/1. PR ini masih berisi implementasi kuis sebelumnya. Penyerahan kantor 3D memakai branch baru feature/kantor-3d-review, bukan pembaruan PR tersebut.

> Panduan teknis lebih rinci, daftar file, contoh konfigurasi non-rahasia, dan log pengujian disertakan dalam paket source. Daftar sisa pekerjaan produksi ada pada docs/03-INTEGRASI-DAN-VERIFIKASI.md.
