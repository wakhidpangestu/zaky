/**
 * Domain Module: Mesin Status Penyaluran & Segregasi Kewenangan
 * Sesuai FR-14 s/d FR-31, ADR-08, dan Bab 6.4, 7.3, 7.4
 */

export type StatusPenyaluran =
  | 'dibuat'
  | 'menunggu_konfirmasi'
  | 'ditolak_penerima'
  | 'dikonfirmasi'
  | 'disetujui'
  | 'tersalurkan'
  | 'kedaluwarsa'
  | 'dibatalkan';

export type MetodeKonfirmasi = 'mustahik' | 'saksi';

export interface PelakuAksi {
  akunId: string;
  unitId: string;
  peran: 'amil' | 'penyetuju' | 'admin';
}

/**
 * Matriks Transisi Status yang Diizinkan (State Transition Matrix)
 */
export const TRANSISI_STATUS: Record<StatusPenyaluran, StatusPenyaluran[]> = {
  dibuat: ['menunggu_konfirmasi', 'dibatalkan', 'kedaluwarsa'],
  menunggu_konfirmasi: ['dikonfirmasi', 'ditolak_penerima', 'kedaluwarsa', 'dibatalkan'],
  ditolak_penerima: [], // State terminal
  dikonfirmasi: ['disetujui', 'dibatalkan', 'kedaluwarsa'],
  disetujui: ['tersalurkan', 'dibatalkan'],
  tersalurkan: [], // State terminal sah
  kedaluwarsa: [], // State terminal
  dibatalkan: [], // State terminal
};

/**
 * Validasi transisi status
 */
export function validasiTransisiStatus(
  statusSaatIni: StatusPenyaluran,
  statusBaru: StatusPenyaluran
): { valid: boolean; error?: string } {
  if (statusSaatIni === statusBaru) {
    return { valid: true };
  }

  const diizinkan = TRANSISI_STATUS[statusSaatIni] || [];
  if (!diizinkan.includes(statusBaru)) {
    return {
      valid: false,
      error: `Transisi status ilegal: tidak dapat mengubah status dari '${statusSaatIni}' menjadi '${statusBaru}'.`,
    };
  }

  return { valid: true };
}

/**
 * Validasi Segregasi Kewenangan Prinsip 4-Mata (Maker-Checker-Witness):
 * 1. Penyetuju tidak boleh sama dengan Pembuat draf.
 * 2. Unit Penyetuju tidak boleh sama dengan Unit Pembuat (pemisahan fungsi penyalur & pemeriksa).
 * 3. Saksi tidak boleh sama dengan Pembuat draf.
 * 4. Saksi 1 dan Saksi 2 harus akun yang berbeda.
 * 5. Penyetuju tidak boleh merupakan salah satu dari saksi (keempat entitas harus akun independen).
 */
export function validasiSegregasiKewenangan(params: {
  pembuat: PelakuAksi;
  penyetuju?: PelakuAksi;
  saksiList?: PelakuAksi[];
}): { valid: boolean; pelanggaran?: string } {
  const { pembuat, penyetuju, saksiList = [] } = params;

  // 1 & 2: Penyetuju vs Pembuat
  if (penyetuju) {
    if (penyetuju.akunId === pembuat.akunId) {
      return {
        valid: false,
        pelanggaran: 'SEPARATION_OF_DUTIES: Penyetuju tidak boleh merupakan akun yang sama dengan pembuat draf.',
      };
    }

    if (penyetuju.unitId === pembuat.unitId) {
      return {
        valid: false,
        pelanggaran:
          'UNIT_INDEPENDENCE: Unit penyetuju harus berbeda dari unit pembuat (mis. Unit Keuangan vs Unit Pelayanan).',
      };
    }
  }

  // 3 & 4: Saksi vs Pembuat & Saksi vs Saksi
  const seenSaksiAkun = new Set<string>();
  for (const saksi of saksiList) {
    if (saksi.akunId === pembuat.akunId) {
      return {
        valid: false,
        pelanggaran: 'WITNESS_CONFLICT: Saksi tidak boleh merupakan akun yang membuat draf.',
      };
    }
    // Samakan dengan lapisan SQL (audit S4): unit saksi juga wajib berbeda
    // dari unit pembuat, bukan hanya akunnya.
    if (saksi.unitId === pembuat.unitId) {
      return {
        valid: false,
        pelanggaran:
          'WITNESS_UNIT_CONFLICT: Saksi harus berasal dari unit yang berbeda dari unit pembuat draf.',
      };
    }
    if (seenSaksiAkun.has(saksi.akunId)) {
      return {
        valid: false,
        pelanggaran: 'DUPLICATE_WITNESS: Saksi yang sama tidak boleh bersaksi dua kali pada penyaluran ini.',
      };
    }
    seenSaksiAkun.add(saksi.akunId);
  }

  // 5: Penyetuju vs Saksi
  if (penyetuju) {
    for (const saksi of saksiList) {
      if (penyetuju.akunId === saksi.akunId) {
        return {
          valid: false,
          pelanggaran:
            'FOUR_EYES_VIOLATION: Penyetuju tidak boleh merupakan salah satu dari saksi konfirmasi penyaluran.',
        };
      }
    }
  }

  return { valid: true };
}
