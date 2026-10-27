/**
 * Test Suite: Perbaikan Keamanan Ronde 5 (Audit K1/K2/R1/S2/S3/S4/S6/S7/T1/R3/R4)
 *
 * Mengunci perilaku perbaikan keamanan agar tidak regresi:
 * - Kata sandi: PBKDF2 600rb iterasi, verifikasi waktu konstan, format rusak
 *   menghasilkan false (bukan exception), hash lama 100rb tetap terverifikasi.
 * - Rate limiting: batas percobaan ditegakkan dan dapat direset.
 * - Anti-replay jaringan: timestamp wajib & segar, nonce sekali pakai,
 *   tanda tangan HMAC jaringan diverifikasi bila secret dikonfigurasi.
 * - Kuorum saksi: kesaksian ganda dari lembaga yang sama TIDAK menggandakan
 *   suara (dedupe), dan status "Belum cukup saksi" bernilai valid=false.
 * - Domain: konfirmasi menolak status yang bukan menunggu_konfirmasi dan
 *   token kedaluwarsa; persetujuan melewati status 'disetujui' sebelum
 *   penyelesaian 'tersalurkan'.
 * - Storage bukti: magic bytes wajib cocok dengan MIME; nama berkas disanitasi.
 * - HMAC telepon: pepper wajib dari env/argumen di luar mode demo.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { hashPassword, verifyPassword } from '../../src/lib/password.ts';
import { checkRateLimit, resetRateLimit } from '../../src/lib/rate-limit.ts';
import {
  validasiTimestamp,
  daftarkanNonce,
  verifikasiSignatureJaringan,
} from '../../src/infrastructure/jaringan/anti-replay.ts';
import { generateEd25519KeyPair } from '../../src/infrastructure/kripto/ed25519.ts';
import { tandaTanganiKesaksian } from '../../src/infrastructure/jaringan/kesaksian.ts';
import { eksekusiHitungUlangPapan } from '../../src/application/use-cases/hitung-ulang-papan.ts';
import { konfirmasiOlehMustahik } from '../../src/application/use-cases/konfirmasi.ts';
import {
  eksekusiPersetujuan,
  eksekusiPenyelesaianPenyaluran,
} from '../../src/application/use-cases/persetujuan.ts';
import { sha256Buffer } from '../../src/infrastructure/kripto/sha256.ts';
import { prosesBerkasBukti, sanitasiNamaBerkas } from '../../src/infrastructure/storage/bukti-storage.ts';
import { hmacTelepon } from '../../src/infrastructure/kripto/hmac.ts';

function assert(cond: unknown, pesan: string) {
  if (!cond) throw new Error(`GAGAL: ${pesan}`);
}

function assertThrows(fn: () => unknown, pesan: string) {
  let melempar = false;
  try {
    fn();
  } catch {
    melempar = true;
  }
  assert(melempar, pesan);
}

async function run() {
  console.log('--- [KEAMANAN] 1. Kata sandi PBKDF2 ---');
  const hashBaru = await hashPassword('rahasia-penguji');
  assert(hashBaru.startsWith('pbkdf2:600000:'), 'hash baru wajib 600rb iterasi');
  assert(await verifyPassword('rahasia-penguji', hashBaru), 'kata sandi benar harus lolos');
  assert(!(await verifyPassword('salah', hashBaru)), 'kata sandi salah harus gagal');
  // Format rusak -> false, bukan exception
  for (const rusak of ['', 'abc', 'pbkdf2:x:y:z', 'pbkdf2:100:zz:zz', 'pbkdf2:99999999:aa:bb', 'demo']) {
    assert(!(await verifyPassword('apa', rusak)), `format rusak harus false: "${rusak}"`);
  }
  // Hash warisan 100rb iterasi tetap terverifikasi (kompatibilitas mundur)
  const salt = crypto.randomBytes(16);
  const legacyHash = crypto.pbkdf2Sync('demo123', salt, 100000, 32, 'sha256');
  const legacyStored = `pbkdf2:100000:${salt.toString('hex')}:${legacyHash.toString('hex')}`;
  assert(await verifyPassword('demo123', legacyStored), 'hash 100rb lama harus tetap lolos');
  console.log('✓ PBKDF2 600rb, waktu konstan, format rusak aman, warisan kompatibel.');

  console.log('--- [KEAMANAN] 2. Rate limiting ---');
  const key = 'uji:1.2.3.4:penguji';
  resetRateLimit(key);
  assert(checkRateLimit(key, 3, 60000).ok, 'percobaan 1 lolos');
  assert(checkRateLimit(key, 3, 60000).ok, 'percobaan 2 lolos');
  assert(checkRateLimit(key, 3, 60000).ok, 'percobaan 3 lolos');
  const blocked = checkRateLimit(key, 3, 60000);
  assert(!blocked.ok && blocked.retryAfterSec > 0, 'percobaan 4 harus diblokir dengan Retry-After');
  resetRateLimit(key);
  assert(checkRateLimit(key, 3, 60000).ok, 'setelah reset harus lolos lagi');
  console.log('✓ Batas percobaan ditegakkan dan reset bekerja.');

  console.log('--- [KEAMANAN] 3. Anti-replay jaringan ---');
  assert(!validasiTimestamp(null).ok, 'timestamp hilang harus ditolak');
  assert(!validasiTimestamp(new Date(Date.now() - 10 * 60000).toISOString()).ok, 'timestamp basi harus ditolak');
  assert(validasiTimestamp(new Date().toISOString()).ok, 'timestamp segar harus lolos');
  assert(daftarkanNonce('nonce-uji-12345678').ok, 'nonce pertama lolos');
  assert(!daftarkanNonce('nonce-uji-12345678').ok, 'nonce yang sama (replay) harus ditolak');
  // Tanda tangan HMAC jaringan
  delete process.env.JARINGAN_SECRET;
  assert(verifikasiSignatureJaringan(null, 't', 'n', 'b').ok, 'tanpa secret (demo) tanda tangan dilewati');
  process.env.JARINGAN_SECRET = 'secret-jaringan-uji';
  const ts = new Date().toISOString();
  const sig = crypto.createHmac('sha256', 'secret-jaringan-uji').update(`${ts}.nonce-x.body-y`).digest('hex');
  assert(verifikasiSignatureJaringan(sig, ts, 'nonce-x', 'body-y').ok, 'HMAC benar harus lolos');
  assert(!verifikasiSignatureJaringan('ab'.repeat(32), ts, 'nonce-x', 'body-y').ok, 'HMAC salah harus ditolak');
  delete process.env.JARINGAN_SECRET;
  console.log('✓ Timestamp wajib, nonce sekali pakai, HMAC jaringan diverifikasi.');

  console.log('--- [KEAMANAN] 4. Kuorum saksi: dedupe per lembaga (S3) ---');
  const idA = '11111111-1111-1111-1111-111111111111';
  const idB = '22222222-2222-2222-2222-222222222222';
  const idC = '33333333-3333-3333-3333-333333333333';
  const kunciB = generateEd25519KeyPair();
  const kunciC = generateEd25519KeyPair();
  const HASH_FIKSTUR = '213b0cb2c833096d0b8713da453259dc700c6f29d89a2dd8f84b5b199042a65b';
  const entriFikstur = {
    nomor: 1,
    lembaga_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    entitas: 'penyaluran',
    entitas_id: 'd1111111-1111-1111-1111-111111111111',
    aksi: 'BUAT_DRAF',
    pelaku: '11111111-1111-1111-1111-111111111111',
    sebelum: null,
    sesudah: { nominal: 800000, status: 'dibuat', catatan: 'Zakat "maal" tahunan' },
    waktu: '2026-10-27T03:00:00.000000Z',
    hash_sebelumnya: '0'.repeat(64),
    hash_saat_ini: HASH_FIKSTUR,
  };

  const berkasDirektori = path.join(process.cwd(), 'direktori', 'anggota.json');
  const cadanganDirektori = fs.readFileSync(berkasDirektori, 'utf8');
  try {
    const direktoriUji = {
      versi: 99,
      terakhir_diperbarui: '2026-10-27',
      deskripsi: 'Direktori khusus uji keamanan',
      anggota: [
        { id: idB, kode: 'LEMBAGA_B', nama: 'B Uji', kota: 'Bandung', provinsi: 'Jabar', endpoint: 'http://localhost', kunci_publik_ed25519: kunciB.publicKeyHex, status: 'aktif', bergabung_pada: '2026-01-01' },
        { id: idC, kode: 'LEMBAGA_C', nama: 'C Uji', kota: 'Surabaya', provinsi: 'Jatim', endpoint: 'http://localhost', kunci_publik_ed25519: kunciC.publicKeyHex, status: 'aktif', bergabung_pada: '2026-01-01' },
      ],
    };
    fs.writeFileSync(berkasDirektori, JSON.stringify(direktoriUji), 'utf8');

    const buatKesaksian = (saksiId: string, priv: string, menit: number) =>
      tandaTanganiKesaksian(
        {
          saksi_lembaga_id: saksiId,
          lembaga_id: idA,
          tanggal: '2026-10-27',
          hash_disaksikan: HASH_FIKSTUR,
          diamati_pada: new Date(Date.now() + menit * 1000).toISOString(),
        },
        priv
      );

    // Dua kesaksian SAH dari lembaga yang SAMA tidak boleh memenuhi kuorum
    const hasilGanda = eksekusiHitungUlangPapan({
      lembagaId: idA,
      tanggal: '2026-10-27',
      daftarLogAudit: [entriFikstur as never],
      hashHarianTerbit: { hash_kepala: HASH_FIKSTUR, jumlah_entri: 1, tanda_tangan: '00' },
      daftarKesaksian: [buatKesaksian(idB, kunciB.privateKeyPem, 1), buatKesaksian(idB, kunciB.privateKeyPem, 2)],
    });
    assert(hasilGanda.jumlahKesaksianValid === 1, `kesaksian ganda satu lembaga harus terhitung 1 (terhitung ${hasilGanda.jumlahKesaksianValid})`);
    assert(hasilGanda.status === 'Belum cukup saksi' && hasilGanda.valid === false, 'kuorum belum cukup harus valid=false');

    // Dua lembaga berbeda -> kuorum tercapai
    const hasilKuorum = eksekusiHitungUlangPapan({
      lembagaId: idA,
      tanggal: '2026-10-27',
      daftarLogAudit: [entriFikstur as never],
      hashHarianTerbit: { hash_kepala: HASH_FIKSTUR, jumlah_entri: 1, tanda_tangan: '00' },
      daftarKesaksian: [buatKesaksian(idB, kunciB.privateKeyPem, 3), buatKesaksian(idC, kunciC.privateKeyPem, 4)],
    });
    assert(hasilKuorum.jumlahKesaksianValid === 2 && hasilKuorum.valid === true, 'dua saksi independen harus mencapai kuorum');
  } finally {
    fs.writeFileSync(berkasDirektori, cadanganDirektori, 'utf8');
  }
  console.log('✓ Dedupe saksi bekerja; semantik "Belum cukup saksi" jujur (valid=false).');

  console.log('--- [KEAMANAN] 5. Domain: status konfirmasi + alur disetujui (S4) ---');
  const pos = {
    id: 'p1111111-1111-1111-1111-111111111111',
    nama: 'Zakat Maal',
    totalMasuk: 6000000,
    saldoTersedia: 1000000,
    saldoDicadangkan: 800000,
    totalTersalurkan: 4200000,
  };
  const token = 'token-rahasia-uji';
  const tokenHash = sha256Buffer(token).toString('hex');
  assertThrows(
    () =>
      konfirmasiOlehMustahik({
        tokenPlaintext: token,
        tokenHashStored: tokenHash,
        statusSaatIni: 'tersalurkan',
        keputusan: 'menerima',
        posDana: pos,
        nominal: 800000,
      }),
    'konfirmasi pada status final harus ditolak'
  );
  assertThrows(
    () =>
      konfirmasiOlehMustahik({
        tokenPlaintext: token,
        tokenHashStored: tokenHash,
        statusSaatIni: 'menunggu_konfirmasi',
        keputusan: 'menerima',
        posDana: pos,
        nominal: 800000,
        kedaluwarsaPada: '2026-01-01T00:00:00.000Z',
        waktuSekarang: '2026-10-27T00:00:00.000Z',
      }),
    'token kedaluwarsa harus ditolak'
  );
  const hasilKonfirmasi = konfirmasiOlehMustahik({
    tokenPlaintext: token,
    tokenHashStored: tokenHash,
    statusSaatIni: 'menunggu_konfirmasi',
    keputusan: 'menerima',
    posDana: pos,
    nominal: 800000,
  });
  assert(hasilKonfirmasi.statusBaru === 'dikonfirmasi', 'konfirmasi sah menghasilkan dikonfirmasi');

  const pembuat = { akunId: 'akun-amil', unitId: 'unit-pelayanan', peran: 'amil' as const };
  const penyetuju = { akunId: 'akun-penyetuju', unitId: 'unit-keuangan', peran: 'penyetuju' as const };
  const hasilSetuju = eksekusiPersetujuan({
    penyaluranId: 'dist-uji',
    nominal: 800000,
    statusSaatIni: 'dikonfirmasi',
    posDana: pos,
    pembuat,
    penyetuju,
  });
  assert(hasilSetuju.statusBaru === 'disetujui', 'persetujuan harus menghasilkan status disetujui');
  assert(hasilSetuju.posDanaBaru.saldoDicadangkan === 800000, 'saldo tidak boleh berpindah pada tahap persetujuan');
  assertThrows(
    () =>
      eksekusiPenyelesaianPenyaluran({
        penyaluranId: 'dist-uji',
        nominal: 800000,
        statusSaatIni: 'dikonfirmasi',
        posDana: pos,
      }),
    'penyelesaian dari status dikonfirmasi (melompati disetujui) harus ditolak'
  );
  const hasilSelesai = eksekusiPenyelesaianPenyaluran({
    penyaluranId: 'dist-uji',
    nominal: 800000,
    statusSaatIni: 'disetujui',
    posDana: pos,
  });
  assert(hasilSelesai.statusBaru === 'tersalurkan', 'penyelesaian menghasilkan tersalurkan');
  assert(
    hasilSelesai.posDanaBaru.saldoDicadangkan === 0 && hasilSelesai.posDanaBaru.totalTersalurkan === 5000000,
    'saldo berpindah dicadangkan -> tersalurkan saat penyelesaian'
  );
  console.log('✓ Status konfirmasi ditegakkan, token kedaluwarsa ditolak, alur disetujui -> tersalurkan utuh.');

  console.log('--- [KEAMANAN] 6. Storage bukti: magic bytes + sanitasi nama (R4) ---');
  const pngBytes = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('isi-gambar-uji'),
  ]);
  const info = prosesBerkasBukti('bukti terima.png', 'image/png', pngBytes);
  assert(info.urlPenyimpanan.includes('bukti_terima.png'.replace(' ', '_')) || info.urlPenyimpanan.includes('bukti'), 'berkas PNG sah harus diterima');
  assertThrows(
    () => prosesBerkasBukti('palsu.pdf', 'application/pdf', pngBytes),
    'isi PNG yang diklaim PDF harus ditolak oleh magic bytes'
  );
  assert(sanitasiNamaBerkas('../../etc/passwd') === 'passwd', 'path traversal harus dibuang');
  assert(!sanitasiNamaBerkas('..\\..\\jahat?.png').includes('..'), 'nama hasil sanitasi tidak boleh mengandung ..');
  console.log('✓ Magic bytes diverifikasi; nama berkas aman dari traversal.');

  console.log('--- [KEAMANAN] 7. Pepper HMAC telepon (S6) ---');
  const envCadangan = { ...process.env };
  delete process.env.TELEPON_PEPPER;
  delete process.env.ZAKY_DEMO_MODE;
  (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
  assertThrows(() => hmacTelepon('081234567890'), 'tanpa pepper env di luar mode demo harus menolak');
  assert(hmacTelepon('081234567890', 'pepper-eksplisit').length === 32, 'pepper eksplisit harus bekerja');
  process.env.TELEPON_PEPPER = 'pepper-dari-env';
  assert(hmacTelepon('081234567890').length === 32, 'pepper dari env harus bekerja');
  Object.assign(process.env, envCadangan);
  console.log('✓ Pepper wajib dari env/argumen di luar mode demo.');

  console.log('SEMUA PENGUJIAN KEAMANAN SUKSES!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
