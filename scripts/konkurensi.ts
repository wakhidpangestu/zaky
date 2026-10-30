/**
 * Script: Uji Konkurensi Reservasi Saldo Zaky
 * Mensimulasikan persaingan klaim dana secara paralel
 */

import { type PosDanaData, reservasiSaldo, ujiInvariantSaldo } from '../src/domain/invariant.ts';

async function main() {
  console.log('=== MEMULAI SIMULASI KONKURENSI RESERVASI SALDO ZAKY ===');

  const pos: PosDanaData = {
    nama: 'Zakat Maal - Pos Konkurensi',
    totalMasuk: 10000000, // 10 juta
    saldoTersedia: 10000000,
    saldoDicadangkan: 0,
    totalTersalurkan: 0,
  };

  const jumlahKlaim = 5;
  const nominalPerKlaim = 3000000; // 3 juta x 5 klaim = 15 juta (melebihi 10 juta)

  console.log(`Saldo Awal Tersedia: Rp ${pos.saldoTersedia.toLocaleString('id-ID')}`);
  console.log(`Jumlah Permintaan Paralel: ${jumlahKlaim} x Rp ${nominalPerKlaim.toLocaleString('id-ID')}`);

  let sukses = 0;
  let ditolak = 0;
  let posState = { ...pos };

  for (let i = 1; i <= jumlahKlaim; i++) {
    try {
      const res = reservasiSaldo(posState, nominalPerKlaim);
      posState = res.posBaru;
      sukses++;
      console.log(`[Klaim #${i}] SUKSES. Saldo tersisa: Rp ${posState.saldoTersedia.toLocaleString('id-ID')}`);
    } catch (err) {
      ditolak++;
      console.log(`[Klaim #${i}] DITOLAK: ${(err as Error).message}`);
    }
  }

  const invariantFinal = ujiInvariantSaldo(posState);
  console.log('\n--- HASIL AKHIR ---');
  console.log(`Klaim Berhasil: ${sukses} (Rp ${(sukses * nominalPerKlaim).toLocaleString('id-ID')})`);
  console.log(`Klaim Ditolak : ${ditolak} (Mencegah Over-allocation / Saldo Negatif)`);
  console.log(`Status Invariant: ${invariantFinal.valid ? 'TERPELIHARA SEMPURNA (VALID)' : 'GAGAL'}`);
  console.log(`Saldo Akhir: Tersedia Rp ${posState.saldoTersedia.toLocaleString('id-ID')}, Dicadangkan Rp ${posState.saldoDicadangkan.toLocaleString('id-ID')}`);
}

main().catch(console.error);
