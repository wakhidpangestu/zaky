/**
 * Domain Module: Asnaf
 * Sesuai QS At-Taubah:60 dan Standar Syariah Zaky FR-14 sampai FR-20
 */

export type AsnafEnum =
  | 'fakir'
  | 'miskin'
  | 'amil'
  | 'muallaf'
  | 'riqab'
  | 'gharimin'
  | 'fisabilillah'
  | 'ibnu_sabil';

export interface AsnafDetail {
  id: AsnafEnum;
  label: string;
  deskripsi: string;
  dasarSyariah: string;
  maksimalPersentase?: number;
}

export const DAFTAR_ASNAF: Record<AsnafEnum, AsnafDetail> = {
  fakir: {
    id: 'fakir',
    label: 'Fakir',
    deskripsi: 'Orang yang tidak memiliki harta atau penghasilan layak untuk mencukupi kebutuhan pokok minimum.',
    dasarSyariah: 'QS At-Taubah: 60 (Fuqara)',
  },
  miskin: {
    id: 'miskin',
    label: 'Miskin',
    deskripsi: 'Orang yang memiliki penghasilan atau pekerjaan namun tidak mencukupi standar haddul kifayah.',
    dasarSyariah: 'QS At-Taubah: 60 (Masakin)',
  },
  amil: {
    id: 'amil',
    label: 'Amil',
    deskripsi: 'Petugas pelaksana yang bertugas menghimpun, mengelola, dan mendistribusikan zakat.',
    dasarSyariah: 'QS At-Taubah: 60 (Al-Amilina Alaiha) - Maks. 12.5% (1/8)',
    maksimalPersentase: 12.5,
  },
  muallaf: {
    id: 'muallaf',
    label: 'Muallaf',
    deskripsi: 'Orang yang baru masuk Islam atau yang dilunakkan hatinya demi kemaslahatan dakwah.',
    dasarSyariah: 'QS At-Taubah: 60 (Al-Muallafati Qulubuhum)',
  },
  riqab: {
    id: 'riqab',
    label: 'Riqab',
    deskripsi: 'Upaya pembebasan dari perbudakan, belenggu perdagangan orang, dan eksploitasi kemanusiaan.',
    dasarSyariah: 'QS At-Taubah: 60 (Wa fir-Riqab)',
  },
  gharimin: {
    id: 'gharimin',
    label: 'Gharimin',
    deskripsi: 'Orang yang menanggung utang untuk kebutuhan mendesak yang halal dan tidak mampu melunasi.',
    dasarSyariah: 'QS At-Taubah: 60 (Wal-Gharimina)',
  },
  fisabilillah: {
    id: 'fisabilillah',
    label: 'Fisabilillah',
    deskripsi: 'Aktivitas perjuangan di jalan Allah, dakwah, penegakan keadilan sosial, dan maslahat umum.',
    dasarSyariah: 'QS At-Taubah: 60 (Wa fi Sabilillah)',
  },
  ibnu_sabil: {
    id: 'ibnu_sabil',
    label: 'Ibnu Sabil',
    deskripsi: 'Musafir yang kehabisan bekal dalam perjalanan ketaatan atau urusan yang mubah.',
    dasarSyariah: 'QS At-Taubah: 60 (Wabnis-Sabil)',
  },
};

/**
 * Validasi apakah string adalah asnaf sah
 */
export function isValidAsnaf(value: string): value is AsnafEnum {
  return Object.prototype.hasOwnProperty.call(DAFTAR_ASNAF, value);
}

/**
 * Verifikasi sumber kebenaran asnaf dari mustahik.
 * Asnaf penyaluran harus mutlak merujuk pada profil data mustahik (ADR-09).
 */
export function cocokkanAsnaf(
  asnafMustahik: AsnafEnum,
  asnafPengajuan: AsnafEnum
): { cocok: boolean; error?: string } {
  if (asnafMustahik !== asnafPengajuan) {
    return {
      cocok: false,
      error: `Asnaf pengajuan (${asnafPengajuan}) tidak cocok dengan ketetapan mustahik (${asnafMustahik}). Asnaf mustahik adalah sumber kebenaran tunggal (ADR-09).`,
    };
  }
  return { cocok: true };
}
