/**
 * Domain Module: Invariant Saldo Kekal (Conservation of Balance)
 * Sesuai FR-01 sampai FR-08 dan ADR-01, ADR-02
 *
 * Persamaan Matematis Mutlak:
 * total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan
 */

export interface PosDanaData {
  id?: string;
  nama: string;
  totalMasuk: number;
  saldoTersedia: number;
  saldoDicadangkan: number;
  totalTersalurkan: number;
}

export interface HasilUjiInvariant {
  valid: boolean;
  selisih: number;
  rincian: {
    totalMasuk: number;
    totalKomponen: number;
    saldoTersedia: number;
    saldoDicadangkan: number;
    totalTersalurkan: number;
  };
  error?: string;
}

/**
 * Menguji apakah pos dana memenuhi Invariant Saldo Kekal dan non-negatif.
 */
export function ujiInvariantSaldo(pos: PosDanaData): HasilUjiInvariant {
  const { totalMasuk, saldoTersedia, saldoDicadangkan, totalTersalurkan } = pos;

  if (saldoTersedia < 0) {
    return {
      valid: false,
      selisih: saldoTersedia,
      rincian: { totalMasuk, totalKomponen: 0, saldoTersedia, saldoDicadangkan, totalTersalurkan },
      error: `Pelanggaran non-negatif: saldo_tersedia bernilai negatif (${saldoTersedia}).`,
    };
  }

  if (saldoDicadangkan < 0) {
    return {
      valid: false,
      selisih: saldoDicadangkan,
      rincian: { totalMasuk, totalKomponen: 0, saldoTersedia, saldoDicadangkan, totalTersalurkan },
      error: `Pelanggaran non-negatif: saldo_dicadangkan bernilai negatif (${saldoDicadangkan}).`,
    };
  }

  if (totalTersalurkan < 0) {
    return {
      valid: false,
      selisih: totalTersalurkan,
      rincian: { totalMasuk, totalKomponen: 0, saldoTersedia, saldoDicadangkan, totalTersalurkan },
      error: `Pelanggaran non-negatif: total_tersalurkan bernilai negatif (${totalTersalurkan}).`,
    };
  }

  const totalKomponen = saldoTersedia + saldoDicadangkan + totalTersalurkan;
  const selisih = Math.abs(totalMasuk - totalKomponen);

  if (selisih !== 0) {
    return {
      valid: false,
      selisih,
      rincian: { totalMasuk, totalKomponen, saldoTersedia, saldoDicadangkan, totalTersalurkan },
      error: `Pelanggaran Invariant Saldo: total_masuk (${totalMasuk}) ≠ saldo_tersedia (${saldoTersedia}) + saldo_dicadangkan (${saldoDicadangkan}) + total_tersalurkan (${totalTersalurkan}). Selisih: ${selisih}.`,
    };
  }

  return {
    valid: true,
    selisih: 0,
    rincian: { totalMasuk, totalKomponen, saldoTersedia, saldoDicadangkan, totalTersalurkan },
  };
}

/**
 * Mensimulasikan reservasi saldo draf secara matematis:
 * Mengurangi saldoTersedia dan menambah saldoDicadangkan sejumlah nominal.
 * Invariant total_masuk dijamin tetap konstan.
 */
export function reservasiSaldo(
  pos: PosDanaData,
  nominal: number
): { posBaru: PosDanaData; hasilUji: HasilUjiInvariant } {
  if (nominal <= 0) {
    throw new Error('Nominal reservasi harus lebih besar dari 0.');
  }

  if (pos.saldoTersedia < nominal) {
    throw new Error(
      `Saldo tersedia tidak mencukupi (Tersedia: Rp ${pos.saldoTersedia.toLocaleString('id-ID')}, Dibutuhkan: Rp ${nominal.toLocaleString('id-ID')}).`
    );
  }

  const posBaru: PosDanaData = {
    ...pos,
    saldoTersedia: pos.saldoTersedia - nominal,
    saldoDicadangkan: pos.saldoDicadangkan + nominal,
  };

  const hasilUji = ujiInvariantSaldo(posBaru);
  return { posBaru, hasilUji };
}

/**
 * Mensimulasikan pelepasan reservasi saat ditolak atau dibatalkan.
 */
export function lepasReservasi(
  pos: PosDanaData,
  nominal: number
): { posBaru: PosDanaData; hasilUji: HasilUjiInvariant } {
  if (pos.saldoDicadangkan < nominal) {
    throw new Error('Saldo dicadangkan tidak mencukupi untuk dilepas.');
  }

  const posBaru: PosDanaData = {
    ...pos,
    saldoTersedia: pos.saldoTersedia + nominal,
    saldoDicadangkan: pos.saldoDicadangkan - nominal,
  };

  const hasilUji = ujiInvariantSaldo(posBaru);
  return { posBaru, hasilUji };
}

/**
 * Mensimulasikan persetujuan akhir penyaluran menjadi tersalurkan sah.
 */
export function selesaikanPenyaluran(
  pos: PosDanaData,
  nominal: number
): { posBaru: PosDanaData; hasilUji: HasilUjiInvariant } {
  if (pos.saldoDicadangkan < nominal) {
    throw new Error('Saldo dicadangkan tidak mencukupi untuk diselesaikan.');
  }

  const posBaru: PosDanaData = {
    ...pos,
    saldoDicadangkan: pos.saldoDicadangkan - nominal,
    totalTersalurkan: pos.totalTersalurkan + nominal,
  };

  const hasilUji = ujiInvariantSaldo(posBaru);
  return { posBaru, hasilUji };
}
