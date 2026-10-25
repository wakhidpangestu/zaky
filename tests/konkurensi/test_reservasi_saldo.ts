/**
 * ZAKY v4.0 — Uji Konkurensi & Invariant Reservasi Saldo (Hari 2)
 * Memverifikasi:
 * - AC-01: Draf melebihi saldo tersedia ditolak (INSUFFICIENT_AVAILABLE_BALANCE)
 * - AC-02: Dua draf Rp 800.000 secara bersamaan pada saldo Rp 1.000.000 -> Tepat 1 berhasil
 * - AC-03: Pembatalan draf melepas reservasi kembali ke saldo tersedia
 * - AC-04: Persetujuan draf memindahkan dicadangkan ke tersalurkan, invariant terjaga
 */

interface PosDana {
  id: string;
  nama: string;
  totalMasuk: number;
  saldoTersedia: number;
  saldoDicadangkan: number;
  totalTersalurkan: number;
  locked: boolean;
}

class SimulasiDatabaseZaky {
  private pos: PosDana;
  private penyaluranList: Array<{ id: string; nominal: number; status: string }> = [];

  constructor(saldoAwalTersedia: number, totalMasuk: number = 6000000, totalTersalurkan: number = 5000000) {
    this.pos = {
      id: 'pos-maal-01',
      nama: 'Zakat Maal',
      totalMasuk,
      saldoTersedia: saldoAwalTersedia,
      saldoDicadangkan: 0,
      totalTersalurkan,
      locked: false,
    };
    this.assertInvariant();
  }

  public assertInvariant() {
    const { totalMasuk, saldoTersedia, saldoDicadangkan, totalTersalurkan } = this.pos;
    const sum = saldoTersedia + saldoDicadangkan + totalTersalurkan;
    if (sum !== totalMasuk) {
      throw new Error(`INVARIANT VIOLATION! totalMasuk (${totalMasuk}) !== sum (${sum})`);
    }
    if (saldoTersedia < 0 || saldoDicadangkan < 0 || totalTersalurkan < 0) {
      throw new Error(`NEGATIVE BALANCE VIOLATION! Saldo tidak boleh negatif.`);
    }
  }

  public getSnapshot(): PosDana {
    return { ...this.pos };
  }

  // Simulasi transaksi dengan baris terkunci: SELECT ... FOR UPDATE
  public async buatDrafPenyaluran(id: string, nominal: number, delayMs: number = 10): Promise<{ success: boolean; error?: string }> {
    // Tunggu jika baris sedang dikunci oleh transaksi lain (Pessimistic Locking)
    while (this.pos.locked) {
      await new Promise((r) => setTimeout(r, 2));
    }

    // KUNCI BARIS (SELECT ... FOR UPDATE)
    this.pos.locked = true;

    try {
      // Simulasi waktu proses server & pembacaan data
      await new Promise((r) => setTimeout(r, delayMs));

      // Pemeriksaan saldo tersedia
      if (nominal > this.pos.saldoTersedia) {
        return {
          success: false,
          error: `INSUFFICIENT_AVAILABLE_BALANCE: Tersedia ${this.pos.saldoTersedia}, diminta ${nominal}`,
        };
      }

      // Mutasi saldo atomik
      this.pos.saldoTersedia -= nominal;
      this.pos.saldoDicadangkan += nominal;

      this.penyaluranList.push({ id, nominal, status: 'menunggu_konfirmasi' });
      this.assertInvariant();

      return { success: true };
    } finally {
      // Lepas kunci
      this.pos.locked = false;
    }
  }

  public async batalkanDraf(id: string): Promise<boolean> {
    while (this.pos.locked) {
      await new Promise((r) => setTimeout(r, 2));
    }
    this.pos.locked = true;

    try {
      const item = this.penyaluranList.find((p) => p.id === id);
      if (!item || item.status !== 'menunggu_konfirmasi') return false;

      this.pos.saldoTersedia += item.nominal;
      this.pos.saldoDicadangkan -= item.nominal;
      item.status = 'dibatalkan';

      this.assertInvariant();
      return true;
    } finally {
      this.pos.locked = false;
    }
  }

  public async setujuiPenyaluran(id: string): Promise<boolean> {
    while (this.pos.locked) {
      await new Promise((r) => setTimeout(r, 2));
    }
    this.pos.locked = true;

    try {
      const item = this.penyaluranList.find((p) => p.id === id);
      if (!item) return false;

      this.pos.saldoDicadangkan -= item.nominal;
      this.pos.totalTersalurkan += item.nominal;
      item.status = 'tersalurkan';

      this.assertInvariant();
      return true;
    } finally {
      this.pos.locked = false;
    }
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('  ZAKY v4.0: UJI KONKURENSI & INVARIANT RESERVASI SALDO');
  console.log('===============================================================\n');

  // -----------------------------------------------------------------
  // UJI 1: AC-01 - Draf Melebihi Saldo Tersedia Ditolak
  // -----------------------------------------------------------------
  console.log('▶ Uji AC-01: Draf melebihi saldo tersedia');
  const db1 = new SimulasiDatabaseZaky(1000000, 6000000, 5000000);
  const res1 = await db1.buatDrafPenyaluran('draf-1', 1500000);

  if (!res1.success && res1.error?.includes('INSUFFICIENT_AVAILABLE_BALANCE')) {
    console.log('  ✓ LULUS: Permintaan draf Rp 1.500.000 pada saldo Rp 1.000.000 ditolak.');
    console.log(`    Pesan error: ${res1.error}`);
  } else {
    throw new Error('AC-01 GAGAL: Seharusnya ditolak dengan INSUFFICIENT_AVAILABLE_BALANCE');
  }

  // -----------------------------------------------------------------
  // UJI 2: AC-02 - Dua Draf Bersamaan Rp 800.000 pada Saldo Rp 1.000.000
  // -----------------------------------------------------------------
  console.log('\n▶ Uji AC-02: Dua draf bersamaan Rp 800.000 pada saldo Rp 1.000.000 (Race condition test)');
  const db2 = new SimulasiDatabaseZaky(1000000, 6000000, 5000000);

  // Jalankan dua request draf secara serentak (Promise.all)
  const [transaksiA, transaksiB] = await Promise.all([
    db2.buatDrafPenyaluran('draf-A', 800000, 15),
    db2.buatDrafPenyaluran('draf-B', 800000, 15),
  ]);

  const state2 = db2.getSnapshot();
  const successCount = (transaksiA.success ? 1 : 0) + (transaksiB.success ? 1 : 0);
  const failCount = (!transaksiA.success ? 1 : 0) + (!transaksiB.success ? 1 : 0);

  console.log(`  - Transaksi A: ${transaksiA.success ? 'BERHASIL' : 'GAGAL (' + transaksiA.error + ')'}`);
  console.log(`  - Transaksi B: ${transaksiB.success ? 'BERHASIL' : 'GAGAL (' + transaksiB.error + ')'}`);
  console.log(`  - Saldo Tersedia Akhir   : Rp ${state2.saldoTersedia.toLocaleString('id-ID')}`);
  console.log(`  - Saldo Dicadangkan Akhir: Rp ${state2.saldoDicadangkan.toLocaleString('id-ID')}`);

  if (successCount === 1 && failCount === 1 && state2.saldoTersedia === 200000 && state2.saldoDicadangkan === 800000) {
    console.log('  ✓ LULUS: Tepat satu draf berhasil! Saldo tersedia Rp 200.000, dicadangkan Rp 800.000.');
  } else {
    throw new Error(`AC-02 GAGAL: Hasil tidak sesuai target AC-02! Sukses: ${successCount}, Gagal: ${failCount}`);
  }

  // -----------------------------------------------------------------
  // UJI 3: AC-03 - Pembatalan Draf Melepas Reservasi
  // -----------------------------------------------------------------
  console.log('\n▶ Uji AC-03: Pembatalan draf melepas reservasi saldo');
  const drafYangBerhasil = transaksiA.success ? 'draf-A' : 'draf-B';
  await db2.batalkanDraf(drafYangBerhasil);
  const state3 = db2.getSnapshot();

  console.log(`  - Saldo Tersedia Setelah Pembatalan   : Rp ${state3.saldoTersedia.toLocaleString('id-ID')}`);
  console.log(`  - Saldo Dicadangkan Setelah Pembatalan: Rp ${state3.saldoDicadangkan.toLocaleString('id-ID')}`);

  if (state3.saldoTersedia === 1000000 && state3.saldoDicadangkan === 0) {
    console.log('  ✓ LULUS: Reservasi Rp 800.000 berhasil dilepas kembali ke saldo tersedia.');
  } else {
    throw new Error('AC-03 GAGAL: Saldo dicadangkan tidak kembali ke saldo tersedia!');
  }

  // -----------------------------------------------------------------
  // UJI 4: AC-04 - Persetujuan Draf Mengonversi Dicadangkan ke Tersalurkan
  // -----------------------------------------------------------------
  console.log('\n▶ Uji AC-04: Persetujuan draf memindahkan saldo dicadangkan ke tersalurkan');
  const db4 = new SimulasiDatabaseZaky(1000000, 6000000, 5000000);
  await db4.buatDrafPenyaluran('draf-final', 400000);
  const stateBeforeApproval = db4.getSnapshot();
  console.log(`  - Sebelum Disetujui: Tersedia Rp ${stateBeforeApproval.saldoTersedia.toLocaleString('id-ID')}, Dicadangkan Rp ${stateBeforeApproval.saldoDicadangkan.toLocaleString('id-ID')}, Tersalurkan Rp ${stateBeforeApproval.totalTersalurkan.toLocaleString('id-ID')}`);

  await db4.setujuiPenyaluran('draf-final');
  const stateAfterApproval = db4.getSnapshot();
  console.log(`  - Setelah Disetujui: Tersedia Rp ${stateAfterApproval.saldoTersedia.toLocaleString('id-ID')}, Dicadangkan Rp ${stateAfterApproval.saldoDicadangkan.toLocaleString('id-ID')}, Tersalurkan Rp ${stateAfterApproval.totalTersalurkan.toLocaleString('id-ID')}`);

  if (
    stateAfterApproval.saldoTersedia === 600000 &&
    stateAfterApproval.saldoDicadangkan === 0 &&
    stateAfterApproval.totalTersalurkan === 5400000 &&
    stateAfterApproval.totalMasuk === 6000000
  ) {
    console.log('  ✓ LULUS: Saldo dicadangkan berpindah ke total_tersalurkan dan Invariant FR-03 tetap 100% konsisten.');
  } else {
    throw new Error('AC-04 GAGAL: Posisi saldo setelah persetujuan tidak valid!');
  }

  console.log('\n===============================================================');
  console.log('  SEMUA PENGUJIAN HARI 2 (AC-01 S/D AC-04) LULUS DENGAN SEMPURNA');
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
