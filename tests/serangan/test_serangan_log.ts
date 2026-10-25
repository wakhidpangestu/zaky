/**
 * Test Suite: Simulasi Serangan Admin Database & Deteksi Papan Silang
 * Sesuai Bab 8.3, Bab 10.3, Bab 12, dan FR-46 s/d FR-52
 *
 * Menguji skenario di mana pemilik database (superuser) mengubah isi log audit:
 * Skenario 1: Admin mengubah data di entri lama tanpa recompute -> Gagal pada verifikasi rantai internal.
 * Skenario 2: Admin mengubah data lalu menghitung ulang rantai ke depan di DB lokal -> Terbongkar oleh
 *             kesaksian silang independen lembaga lain di Papan Silang.
 */

import { type EntriLogAudit, hitungUlangRantaiLog, verifikasiSilang } from '../../src/infrastructure/log/verifikasi-rantai.ts';
import { kanonikalJson } from '../../src/infrastructure/kripto/jcs.ts';
import { sha256Buffer } from '../../src/infrastructure/kripto/sha256.ts';

function buatLogSample(jumlah: number): EntriLogAudit[] {
  const list: EntriLogAudit[] = [];
  let prevHash: any = Buffer.alloc(32, 0);

  for (let i = 1; i <= jumlah; i++) {
    const payload = {
      aksi: i === 1 ? 'BUAT_DRAF' : i === 2 ? 'KONFIRMASI_SAKSI' : 'PENYALURAN_SELESAI',
      entitas: 'penyaluran',
      entitas_id: `penyaluran-uuid-${i}`,
      lembaga_id: '11111111-1111-1111-1111-111111111111',
      nomor: i,
      pelaku: `amil-${i}`,
      sebelum: null,
      sesudah: { nominal: 5000000 * i },
      waktu: `2026-10-25T10:0${i}:00.000000Z`,
    };

    const payloadUtf8 = Buffer.from(kanonikalJson(payload), 'utf8');
    const hashSaatIni = sha256Buffer(Buffer.concat([payloadUtf8, prevHash]));

    list.push({
      nomor: i,
      lembaga_id: payload.lembaga_id,
      entitas: payload.entitas,
      entitas_id: payload.entitas_id,
      aksi: payload.aksi,
      pelaku: payload.pelaku,
      sebelum: payload.sebelum,
      sesudah: payload.sesudah,
      waktu: payload.waktu,
      hash_sebelumnya: prevHash.toString('hex'),
      hash_saat_ini: hashSaatIni.toString('hex'),
    });

    prevHash = hashSaatIni;
  }

  return list;
}

function runSeranganTests() {
  console.log('--- [TEST] 1. Verifikasi Keadaan Normal Tanpa Serangan ---');
  const logAsli = buatLogSample(5);
  const hashKepalaAsli = logAsli[4].hash_saat_ini;

  // Lembaga B dan C menyaksikan hash asli yang sah
  const kesaksianPeer = [hashKepalaAsli, hashKepalaAsli];

  const hasilNormal = verifikasiSilang({
    daftarEntri: logAsli,
    jumlahEntri: 5,
    hashKepalaTerbit: hashKepalaAsli,
    daftarHashDisaksikanSaksi: kesaksianPeer,
  });

  if (hasilNormal.status !== 'Terkonfirmasi') {
    throw new Error(`Kondisi normal harus Terkonfirmasi, didapat: ${hasilNormal.status}`);
  }
  console.log('✓ Kondisi normal terkonfirmasi 100% konsensus.');

  console.log('\n--- [TEST] 2. Serangan 1: Admin Memanipulasi Nominal pada Entri #2 ---');
  const logDimanipulasi = JSON.parse(JSON.stringify(logAsli)) as EntriLogAudit[];
  // Admin mengubah nominal dari Rp 10.000.000 menjadi Rp 100.000.000
  logDimanipulasi[1].sesudah = { nominal: 100000000 };

  const hasilHitungTamper = hitungUlangRantaiLog(logDimanipulasi, 5);
  if (hasilHitungTamper.sukses) {
    throw new Error('Manipulasi data harus menggagalkan hitung ulang!');
  }
  console.log(`✓ Manipulasi terdeteksi seketika pada log nomor ${hasilHitungTamper.entriBermasalah}!`);

  console.log('\n--- [TEST] 3. Serangan 2: Admin Recompute Rantai Lokal tapi Dicegat Saksi Silang ---');
  // Admin yang cerdas mencoba merecompute hash dari entri #2 sampai #5 di basis data lokalnya
  const logRecomputed = JSON.parse(JSON.stringify(logDimanipulasi)) as EntriLogAudit[];
  let prevHash: any = Buffer.from(logRecomputed[0].hash_saat_ini, 'hex');

  for (let i = 1; i < logRecomputed.length; i++) {
    const entri = logRecomputed[i];
    entri.hash_sebelumnya = prevHash.toString('hex');
    const payload = {
      aksi: entri.aksi,
      entitas: entri.entitas,
      entitas_id: entri.entitas_id,
      lembaga_id: entri.lembaga_id,
      nomor: entri.nomor,
      pelaku: entri.pelaku,
      sebelum: entri.sebelum || null,
      sesudah: entri.sesudah || null,
      waktu: entri.waktu,
    };
    const payloadUtf8 = Buffer.from(kanonikalJson(payload), 'utf8');
    const newHash = sha256Buffer(Buffer.concat([payloadUtf8, prevHash]));
    entri.hash_saat_ini = newHash.toString('hex');
    prevHash = newHash;
  }

  const hashPalsuLokal = logRecomputed[4].hash_saat_ini;

  // Papan silang membandingkan hash recompute lokal dengan salinan kesaksian yang sudah dipegang Lembaga B & C
  const hasilUjiSilang = verifikasiSilang({
    daftarEntri: logRecomputed,
    jumlahEntri: 5,
    hashKepalaTerbit: hashPalsuLokal,
    daftarHashDisaksikanSaksi: kesaksianPeer, // Peer memegang hash asli sebelum diubah
  });

  if (hasilUjiSilang.status !== 'Tidak cocok') {
    throw new Error(`Serangan recompute admin harus berstatus 'Tidak cocok', didapat: ${hasilUjiSilang.status}`);
  }

  console.log(`✓ Status Papan Silang: '${hasilUjiSilang.status}'.`);
  console.log(`✓ Keterangan: ${hasilUjiSilang.rincianPemeriksaan.keterangan}`);
  console.log('\nSEMUA PENGUJIAN DETEKSI SERANGAN SUKSES!');
}

runSeranganTests();
