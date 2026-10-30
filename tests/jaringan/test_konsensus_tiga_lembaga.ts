/**
 * Test Suite: Konsensus Federasi Tiga Lembaga (Lembaga A, B, C)
 * Sesuai Bab 2, Bab 8.2, Bab 12, Bab 13, dan FR-42 s/d FR-45
 */

import { generateEd25519KeyPair } from '../../src/infrastructure/kripto/ed25519.ts';
import { tandaTanganiKesaksian, verifikasiTandaTanganKesaksian } from '../../src/infrastructure/jaringan/kesaksian.ts';
import { eksekusiPenerbitanHashHarian } from '../../src/application/use-cases/penerbitan-hash.ts';
import { sha256Hex } from '../../src/infrastructure/kripto/sha256.ts';

function runKonsensusTests() {
  console.log('--- [TEST] 1. Inisialisasi Kunci Ed25519 Tiga Lembaga Independen ---');
  const kunciA = generateEd25519KeyPair();
  const kunciB = generateEd25519KeyPair();
  const kunciC = generateEd25519KeyPair();

  const idA = '11111111-1111-1111-1111-111111111111';
  const idB = '22222222-2222-2222-2222-222222222222';
  const idC = '33333333-3333-3333-3333-333333333333';

  console.log('✓ Lembaga A (Pusat), B (Bandung), C (Surabaya) siap.');

  console.log('\n--- [TEST] 2. Penerbitan Hash Harian oleh Lembaga A ---');
  const tanggalUji = '2026-10-25';
  const hashKepalaA = sha256Hex('state-of-chain-lembaga-a-2026-10-25');

  const terbitA = eksekusiPenerbitanHashHarian({
    lembagaId: idA,
    tanggal: tanggalUji,
    hashKepala: hashKepalaA,
    jumlahEntri: 42,
    privateKeyPem: kunciA.privateKeyPem,
  });

  console.log(`✓ Hash Harian A diterbitkan: ${terbitA.hash_kepala.substring(0, 16)}...`);

  console.log('\n--- [TEST] 3. Lembaga B dan C Mengamati dan Menandatangani Kesaksian Silang ---');
  const waktuAmati = new Date().toISOString();

  // Lembaga B bersaksi atas Lembaga A
  const kesaksianB = tandaTanganiKesaksian(
    {
      saksi_lembaga_id: idB,
      lembaga_id: idA,
      tanggal: tanggalUji,
      hash_disaksikan: terbitA.hash_kepala,
      diamati_pada: waktuAmati,
    },
    kunciB.privateKeyPem
  );

  // Lembaga C bersaksi atas Lembaga A
  const kesaksianC = tandaTanganiKesaksian(
    {
      saksi_lembaga_id: idC,
      lembaga_id: idA,
      tanggal: tanggalUji,
      hash_disaksikan: terbitA.hash_kepala,
      diamati_pada: waktuAmati,
    },
    kunciC.privateKeyPem
  );

  // Verifikasi tanda tangan B
  const validB = verifikasiTandaTanganKesaksian(kesaksianB, kunciB.publicKeyHex);
  if (!validB) throw new Error('Verifikasi tanda tangan kesaksian Lembaga B gagal!');

  // Verifikasi tanda tangan C
  const validC = verifikasiTandaTanganKesaksian(kesaksianC, kunciC.publicKeyHex);
  if (!validC) throw new Error('Verifikasi tanda tangan kesaksian Lembaga C gagal!');

  console.log('✓ Tanda tangan kesaksian Lembaga B valid dengan kunci publik B.');
  console.log('✓ Tanda tangan kesaksian Lembaga C valid dengan kunci publik C.');

  console.log('\n--- [TEST] 4. Evaluasi Konsensus 2-Saksi Independen ---');
  const daftarKesaksian = [kesaksianB.hash_disaksikan, kesaksianC.hash_disaksikan];
  const konsensusTercapai = daftarKesaksian.every((h) => h === terbitA.hash_kepala) && daftarKesaksian.length >= 2;

  if (!konsensusTercapai) {
    throw new Error('Konsensus silang 2-saksi gagal dicapai!');
  }

  console.log('✓ Konsensus P2P 3-Lembaga Sukses: Hash Lembaga A disaksikan sah oleh B & C.');
  console.log('\nSEMUA PENGUJIAN JARINGAN FEDERASI SUKSES!');
}

runKonsensusTests();
