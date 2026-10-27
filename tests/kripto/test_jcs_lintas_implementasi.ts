/**
 * Test Suite: Kontrak Lintas Implementasi Format Kanonik Rantai (Audit T1)
 *
 * Pasangan dari db/tests/test_jcs_rantai.sql. Kedua uji menegaskan string
 * payload JCS dan hash rantai yang IDENTIK untuk entri fikstur yang sama:
 * - TypeScript: kanonikalJson + hitungUlangRantaiLog (verifikator)
 * - SQL: payload_rantai_jcs + digest (migrasi 004)
 *
 * Sebelum migrasi 004, lapisan SQL memakai json_build_object()::text yang
 * byte-nya berbeda dari JCS, sehingga rantai SQL tidak dapat diverifikasi
 * oleh verifikator TS. Fikstur di bawah adalah kontrak yang mengunci
 * kesetaraan itu; mengubah salah satu sisi tanpa sisi lain akan menggagalkan
 * salah satu dari dua uji ini.
 */

import { kanonikalJson } from '../../src/infrastructure/kripto/jcs.ts';
import { hitungUlangRantaiLog, type EntriLogAudit } from '../../src/infrastructure/log/verifikasi-rantai.ts';

const PAYLOAD_FIKSTUR =
  '{"aksi":"BUAT_DRAF","entitas":"penyaluran","entitas_id":"d1111111-1111-1111-1111-111111111111","lembaga_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","nomor":1,"pelaku":"11111111-1111-1111-1111-111111111111","sebelum":null,"sesudah":{"catatan":"Zakat \\"maal\\" tahunan","nominal":800000,"status":"dibuat"},"waktu":"2026-10-27T03:00:00.000000Z"}';

const HASH_FIKSTUR = '213b0cb2c833096d0b8713da453259dc700c6f29d89a2dd8f84b5b199042a65b';
const HASH_NOL = '0'.repeat(64);

function runLintasTests() {
  console.log('--- [TEST LINTAS] 1. String payload JCS identik dengan kontrak SQL ---');
  const payloadObject = {
    aksi: 'BUAT_DRAF',
    entitas: 'penyaluran',
    entitas_id: 'd1111111-1111-1111-1111-111111111111',
    lembaga_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nomor: 1,
    pelaku: '11111111-1111-1111-1111-111111111111',
    sebelum: null,
    sesudah: { nominal: 800000, status: 'dibuat', catatan: 'Zakat "maal" tahunan' },
    waktu: '2026-10-27T03:00:00.000000Z',
  };
  const teks = kanonikalJson(payloadObject);
  if (teks !== PAYLOAD_FIKSTUR) {
    throw new Error(`Payload JCS TS menyimpang dari kontrak!\nTerbangun:  ${teks}\nSeharusnya: ${PAYLOAD_FIKSTUR}`);
  }
  console.log('✓ Payload JCS TypeScript identik byte-per-byte dengan kontrak SQL (migrasi 004).');

  console.log('--- [TEST LINTAS] 2. Verifikator TS menerima rantai berformat SQL/JCS ---');
  const entri: EntriLogAudit = {
    nomor: 1,
    lembaga_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    entitas: 'penyaluran',
    entitas_id: 'd1111111-1111-1111-1111-111111111111',
    aksi: 'BUAT_DRAF',
    pelaku: '11111111-1111-1111-1111-111111111111',
    sebelum: null,
    sesudah: { nominal: 800000, status: 'dibuat', catatan: 'Zakat "maal" tahunan' },
    waktu: '2026-10-27T03:00:00.000000Z',
    hash_sebelumnya: HASH_NOL,
    hash_saat_ini: HASH_FIKSTUR,
  };
  const hasil = hitungUlangRantaiLog([entri], 1);
  if (!hasil.sukses || hasil.hashAkhirHex !== HASH_FIKSTUR) {
    throw new Error(`Verifikator TS menolak rantai fikstur: ${hasil.pesanError ?? hasil.hashAkhirHex}`);
  }
  console.log('✓ hitungUlangRantaiLog memvalidasi hash yang dihasilkan format SQL/JCS.');

  console.log('--- [TEST LINTAS] 3. Manipulasi satu field terdeteksi ---');
  const entriManipulasi: EntriLogAudit = {
    ...entri,
    sesudah: { nominal: 900000, status: 'dibuat', catatan: 'Zakat "maal" tahunan' },
  };
  const hasilManipulasi = hitungUlangRantaiLog([entriManipulasi], 1);
  if (hasilManipulasi.sukses) {
    throw new Error('Manipulasi nominal TIDAK terdeteksi oleh verifikator!');
  }
  console.log('✓ Perubahan nominal pada payload membuat hash tidak cocok (terdeteksi).');

  console.log('SEMUA PENGUJIAN LINTAS IMPLEMENTASI JCS SUKSES!');
}

runLintasTests();
