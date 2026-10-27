/**
 * Application Use Case: Buat Draf Penyaluran & Reservasi Saldo
 * Sesuai FR-01 s/d FR-08, FR-14 s/d FR-20, ADR-01, ADR-02, ADR-03
 *
 * Mengikuti Urutan Penguncian Global:
 * pos_dana -> penyaluran -> rantai_kepala
 */

import { AsnafEnum, DAFTAR_ASNAF } from '../../domain/asnaf';
import { reservasiSaldo, PosDanaData } from '../../domain/invariant';
import { StatusPenyaluran, PelakuAksi } from '../../domain/mesin-status';
import { generateRandomToken } from '../../infrastructure/kripto/sha256';

export interface BuatDrafCommand {
  posDana: PosDanaData;
  mustahik: {
    id: string;
    namaSamaran: string;
    asnaf: AsnafEnum;
  };
  nominal: number;
  pembuat: PelakuAksi;
  kedaluwarsaJam?: number;
}

export interface BuatDrafResult {
  penyaluranId: string;
  kodeUnik: string;
  posDanaBaru: PosDanaData;
  status: StatusPenyaluran;
  asnaf: AsnafEnum;
  nominal: number;
  kedaluwarsaPada: string;
  logAuditPayload: {
    aksi: string;
    entitas: string;
    entitas_id: string;
    pelaku: string;
  };
}

/**
 * Eksekusi draf penyaluran dengan jaminan reservasi saldo dan invariant matematis
 */
export function eksekusiBuatDraf(cmd: BuatDrafCommand): BuatDrafResult {
  const { posDana, mustahik, nominal, pembuat, kedaluwarsaJam = 72 } = cmd;

  if (pembuat.peran !== 'amil') {
    throw new Error('Hanya amil yang berhak membuat draf pengajuan penyaluran.');
  }

  // NaN ikut ditolak (audit R3): perbandingan NaN <= 0 bernilai false,
  // sehingga tanpa cek keterhinggaan NaN dapat lolos dan meracuni state.
  if (!Number.isFinite(nominal) || nominal <= 0) {
    throw new Error('Nominal penyaluran harus bernilai positif.');
  }

  // ADR-09: Asnaf mutlak diambil dari penetapan mustahik, bukan parameter input bebas
  const asnafFinal = mustahik.asnaf;
  if (!DAFTAR_ASNAF[asnafFinal]) {
    throw new Error(`Asnaf ${asnafFinal} tidak sah.`);
  }

  // 1. Kunci dan reservasi pos dana (ADR-02: dana dicadangkan segera)
  const { posBaru, hasilUji } = reservasiSaldo(posDana, nominal);
  if (!hasilUji.valid) {
    throw new Error(hasilUji.error || 'Pelanggaran invariant saldo pos dana.');
  }

  // 2. Buat identitas unik penyaluran
  const penyaluranId = generateRandomToken(16);
  // Kode unik 12 karakter alfanumerik (mis. ZK8B7V2KNT9X)
  const kodeUnik = `ZK${generateRandomToken(5).toUpperCase()}`;

  const kedaluwarsaDate = new Date();
  kedaluwarsaDate.setHours(kedaluwarsaDate.getHours() + kedaluwarsaJam);

  return {
    penyaluranId,
    kodeUnik,
    posDanaBaru: posBaru,
    status: 'dibuat',
    asnaf: asnafFinal,
    nominal,
    kedaluwarsaPada: kedaluwarsaDate.toISOString(),
    logAuditPayload: {
      aksi: 'DIBUAT',
      entitas: 'penyaluran',
      entitas_id: penyaluranId,
      pelaku: pembuat.akunId,
    },
  };
}
