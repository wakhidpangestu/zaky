/**
 * Domain Module: Hak Amil & Penerimaan
 * Sesuai QS At-Taubah:60, Fatwa MUI No. 8/2011, UU No. 23/2011 Pasal 32, dan FR-09 s/d FR-13
 */

export const MAKS_PERSENTASE_HAK_AMIL = 12.5; // 1/8 bagian asnaf

export interface PerhitunganPenerimaan {
  bruto: number;
  hakAmil: number;
  masukPos: number;
  persentaseAmil: number;
}

/**
 * Menghitung alokasi penerimaan zakat masuk antara hak operasional amil dan pos dana mustahik.
 * Batas maksimal hak amil adalah 12.5% (1/8).
 */
export function hitungAlokasiPenerimaan(
  bruto: number,
  persentaseAmil: number = MAKS_PERSENTASE_HAK_AMIL
): PerhitunganPenerimaan {
  if (bruto <= 0) {
    throw new Error('Nilai bruto penerimaan zakat harus lebih besar dari 0.');
  }

  if (persentaseAmil < 0 || persentaseAmil > MAKS_PERSENTASE_HAK_AMIL) {
    throw new Error(
      `Persentase hak amil (${persentaseAmil}%) melanggar batas syariah maksimal ${MAKS_PERSENTASE_HAK_AMIL}% (1/8 bagian).`
    );
  }

  const hakAmil = Math.round((bruto * persentaseAmil) / 100);
  const masukPos = bruto - hakAmil;

  return {
    bruto,
    hakAmil,
    masukPos,
    persentaseAmil,
  };
}

/**
 * Memvalidasi invariant penerimaan: bruto = hak_amil + masuk_pos (FR-11).
 */
export function validasiInvariantPenerimaan(
  bruto: number,
  hakAmil: number,
  masukPos: number
): { valid: boolean; selisih: number; error?: string } {
  if (bruto <= 0) {
    return { valid: false, selisih: bruto, error: 'Bruto harus bernilai positif.' };
  }
  if (hakAmil < 0) {
    return { valid: false, selisih: hakAmil, error: 'Hak amil tidak boleh bernilai negatif.' };
  }
  if (masukPos < 0) {
    return { valid: false, selisih: masukPos, error: 'Dana masuk pos tidak boleh bernilai negatif.' };
  }

  const totalKomponen = hakAmil + masukPos;
  const selisih = Math.abs(bruto - totalKomponen);

  if (selisih !== 0) {
    return {
      valid: false,
      selisih,
      error: `Pelanggaran Invariant Penerimaan: bruto (${bruto}) tidak sama dengan hak_amil (${hakAmil}) + masuk_pos (${masukPos}). Selisih: ${selisih}.`,
    };
  }

  // Uji batasan hak amil
  if (hakAmil > (bruto * MAKS_PERSENTASE_HAK_AMIL) / 100) {
    return {
      valid: false,
      selisih: 0,
      error: `Hak amil (Rp ${hakAmil.toLocaleString('id-ID')}) melebihi kuota syariah 12.5% dari bruto.`,
    };
  }

  return { valid: true, selisih: 0 };
}
