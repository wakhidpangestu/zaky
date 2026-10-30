/**
 * Test Suite: Domain Rules (Asnaf, Hak Amil, dan Invariant Saldo)
 * Memvalidasi kepatuhan pada FR-01 s/d FR-13 dan batasan syariah
 */

import { DAFTAR_ASNAF, cocokkanAsnaf, isValidAsnaf } from '../../src/domain/asnaf.ts';
import { hitungAlokasiPenerimaan, validasiInvariantPenerimaan, MAKS_PERSENTASE_HAK_AMIL } from '../../src/domain/hak-amil.ts';
import { ujiInvariantSaldo, reservasiSaldo, lepasReservasi, selesaikanPenyaluran, type PosDanaData } from '../../src/domain/invariant.ts';
import { validasiSegregasiKewenangan } from '../../src/domain/mesin-status.ts';

function runDomainTests() {
  console.log('--- [TEST] 1. Validasi 8 Asnaf (QS At-Taubah:60) ---');
  const asnafKeys = Object.keys(DAFTAR_ASNAF);
  if (asnafKeys.length !== 8) {
    throw new Error(`Jumlah asnaf harus 8, ditemukan ${asnafKeys.length}`);
  }
  if (!isValidAsnaf('fakir') || !isValidAsnaf('fisabilillah')) {
    throw new Error('Validasi asnaf gagal');
  }

  const cocokTest = cocokkanAsnaf('miskin', 'fakir');
  if (cocokTest.cocok) {
    throw new Error('Harus gagal jika asnaf pengajuan berbeda dengan mustahik');
  }
  console.log('✓ 8 Asnaf dan pencocokan mustahik lulus.');

  console.log('--- [TEST] 2. Alokasi Hak Amil & Batas Syariah 12.5% ---');
  const alokasi = hitungAlokasiPenerimaan(10000000, 12.5);
  if (alokasi.hakAmil !== 1250000 || alokasi.masukPos !== 8750000) {
    throw new Error('Perhitungan alokasi amil salah');
  }

  const validasi = validasiInvariantPenerimaan(10000000, 1250000, 8750000);
  if (!validasi.valid) {
    throw new Error(`Validasi invariant penerimaan gagal: ${validasi.error}`);
  }

  let threwExceeded = false;
  try {
    hitungAlokasiPenerimaan(10000000, 15); // Melebihi 12.5%
  } catch (err) {
    threwExceeded = true;
  }
  if (!threwExceeded) {
    throw new Error('Harus melempar error jika hak amil melebihi 12.5%');
  }
  console.log('✓ Batas maksimal 12.5% hak amil terverifikasi.');

  console.log('--- [TEST] 3. Invariant Saldo Kekal & Transisi Saldo ---');
  const posAwal: PosDanaData = {
    nama: 'Zakat Maal',
    totalMasuk: 100000000,
    saldoTersedia: 100000000,
    saldoDicadangkan: 0,
    totalTersalurkan: 0,
  };

  const ujiAwal = ujiInvariantSaldo(posAwal);
  if (!ujiAwal.valid) throw new Error('Pos awal tidak valid');

  // Reservasi 15 juta
  const { posBaru: posDireservasi } = reservasiSaldo(posAwal, 15000000);
  if (posDireservasi.saldoTersedia !== 85000000 || posDireservasi.saldoDicadangkan !== 15000000) {
    throw new Error('Reservasi saldo salah');
  }
  const ujiReservasi = ujiInvariantSaldo(posDireservasi);
  if (!ujiReservasi.valid) throw new Error('Invariant pecah saat reservasi');

  // Selesaikan 15 juta
  const { posBaru: posSelesai } = selesaikanPenyaluran(posDireservasi, 15000000);
  if (posSelesai.saldoDicadangkan !== 0 || posSelesai.totalTersalurkan !== 15000000) {
    throw new Error('Penyelesaian saldo salah');
  }
  const ujiSelesai = ujiInvariantSaldo(posSelesai);
  if (!ujiSelesai.valid) throw new Error('Invariant pecah saat penyelesaian');

  console.log('✓ Invariant saldo kekal terverifikasi di seluruh siklus hidup.');

  console.log('--- [TEST] 4. Segregasi Kewenangan 4-Mata ---');
  const pembuat = { akunId: 'user-budi', unitId: 'unit-pelayanan', peran: 'amil' as const };
  const penyetujuSama = { akunId: 'user-budi', unitId: 'unit-keuangan', peran: 'penyetuju' as const };
  const penyetujuUnitSama = { akunId: 'user-hari', unitId: 'unit-pelayanan', peran: 'penyetuju' as const };
  const penyetujuSah = { akunId: 'user-hari', unitId: 'unit-keuangan', peran: 'penyetuju' as const };

  const testAkunSama = validasiSegregasiKewenangan({ pembuat, penyetuju: penyetujuSama });
  if (testAkunSama.valid) throw new Error('Penyetuju akun sama harus ditolak');

  const testUnitSama = validasiSegregasiKewenangan({ pembuat, penyetuju: penyetujuUnitSama });
  if (testUnitSama.valid) throw new Error('Penyetuju unit sama harus ditolak');

  const testSah = validasiSegregasiKewenangan({ pembuat, penyetuju: penyetujuSah });
  if (!testSah.valid) throw new Error('Penyetuju sah harus diterima');

  console.log('✓ Segregasi kewenangan 4-mata lulus uji.');
  console.log('\nSEMUA PENGUJIAN DOMAIN SUKSES!');
}

runDomainTests();
