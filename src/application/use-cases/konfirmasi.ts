/**
 * Application Use Case: Konfirmasi Penyaluran (Mustahik & Dua Saksi)
 * Sesuai FR-21 s/d FR-28, ADR-08
 */

import { type StatusPenyaluran, type PelakuAksi, validasiSegregasiKewenangan } from '../../domain/mesin-status.ts';
import { type PosDanaData, lepasReservasi } from '../../domain/invariant.ts';
import { sha256Buffer } from '../../infrastructure/kripto/sha256.ts';

export interface KonfirmasiMustahikCommand {
  tokenPlaintext: string;
  tokenHashStored: string;
  statusSaatIni: StatusPenyaluran;
  keputusan: 'menerima' | 'menolak';
  posDana: PosDanaData;
  nominal: number;
  /** Batas akhir masa berlaku token (ISO 8601); diperiksa bila disertakan. */
  kedaluwarsaPada?: string;
  /** Waktu evaluasi (ISO 8601); bawaan: waktu saat ini. */
  waktuSekarang?: string;
}

export interface KonfirmasiSaksiCommand {
  saksi: PelakuAksi;
  pembuat: PelakuAksi;
  saksiSebelumnya?: PelakuAksi[];
  statusSaatIni: StatusPenyaluran;
  keputusan: 'menerima' | 'menolak';
  posDana: PosDanaData;
  nominal: number;
}

export interface HasilKonfirmasi {
  statusBaru: StatusPenyaluran;
  posDanaBaru: PosDanaData;
  pesan: string;
  selesaiDikonfirmasi: boolean;
}

/**
 * Konfirmasi langsung oleh Mustahik melalui tautan sekali pakai
 */
export function konfirmasiOlehMustahik(cmd: KonfirmasiMustahikCommand): HasilKonfirmasi {
  const { tokenPlaintext, tokenHashStored, statusSaatIni, keputusan, posDana, nominal } = cmd;

  // Status WAJIB diperiksa (audit S4): konfirmasi hanya sah dari status
  // 'menunggu_konfirmasi' - sebelumnya parameter ini diterima lalu diabaikan,
  // sehingga pengajuan yang sudah final dapat "dikonfirmasi" ulang.
  if (statusSaatIni !== 'menunggu_konfirmasi') {
    throw new Error(
      `Konfirmasi tidak dapat diproses karena status saat ini '${statusSaatIni}' (harus 'menunggu_konfirmasi').`
    );
  }

  // Masa berlaku token diperiksa bila batasnya diketahui
  if (cmd.kedaluwarsaPada) {
    const batas = new Date(cmd.kedaluwarsaPada).getTime();
    const sekarang = new Date(cmd.waktuSekarang ?? new Date().toISOString()).getTime();
    if (!Number.isNaN(batas) && sekarang > batas) {
      throw new Error('Token konfirmasi telah kedaluwarsa.');
    }
  }

  // Verifikasi hash token 32 byte
  const computedHashHex = sha256Buffer(tokenPlaintext).toString('hex');
  if (computedHashHex.toLowerCase() !== tokenHashStored.toLowerCase()) {
    throw new Error('Token konfirmasi tidak sah atau telah kedaluwarsa.');
  }

  if (keputusan === 'menolak') {
    // Jika ditolak, lepas reservasi saldo kembali ke saldo_tersedia
    const { posBaru } = lepasReservasi(posDana, nominal);
    return {
      statusBaru: 'ditolak_penerima',
      posDanaBaru: posBaru,
      pesan: 'Penyaluran ditolak oleh penerima manfaat. Dana cadangan telah dikembalikan ke saldo tersedia.',
      selesaiDikonfirmasi: false,
    };
  }

  return {
    statusBaru: 'dikonfirmasi',
    posDanaBaru: posDana,
    pesan: 'Konfirmasi penerima berhasil dicatat. Menunggu persetujuan unit keuangan.',
    selesaiDikonfirmasi: true,
  };
}

/**
 * Konfirmasi oleh Saksi Amil Independen (Metode 2 Saksi)
 */
export function konfirmasiOlehSaksi(cmd: KonfirmasiSaksiCommand): HasilKonfirmasi {
  const { saksi, pembuat, saksiSebelumnya = [], statusSaatIni, keputusan, posDana, nominal } = cmd;

  // Status diperiksa sama seperti jalur mustahik (audit S4)
  if (statusSaatIni !== 'menunggu_konfirmasi') {
    throw new Error(
      `Kesaksian tidak dapat diproses karena status saat ini '${statusSaatIni}' (harus 'menunggu_konfirmasi').`
    );
  }

  // Validasi aturan segregasi
  const segregasi = validasiSegregasiKewenangan({
    pembuat,
    saksiList: [...saksiSebelumnya, saksi],
  });

  if (!segregasi.valid) {
    throw new Error(segregasi.pelanggaran);
  }

  if (keputusan === 'menolak') {
    const { posBaru } = lepasReservasi(posDana, nominal);
    return {
      statusBaru: 'ditolak_penerima',
      posDanaBaru: posBaru,
      pesan: 'Penyaluran ditolak oleh saksi. Dana cadangan telah dilepas kembali ke saldo tersedia.',
      selesaiDikonfirmasi: false,
    };
  }

  const totalSaksi = saksiSebelumnya.length + 1;
  if (totalSaksi >= 2) {
    return {
      statusBaru: 'dikonfirmasi',
      posDanaBaru: posDana,
      pesan: `Penyaluran telah disaksikan oleh ${totalSaksi} saksi sah. Status kini 'dikonfirmasi' siap persetujuan.`,
      selesaiDikonfirmasi: true,
    };
  }

  return {
    statusBaru: 'menunggu_konfirmasi',
    posDanaBaru: posDana,
    pesan: `Saksi ke-1 telah mencatat kesaksian. Menunggu 1 saksi independen lainnya.`,
    selesaiDikonfirmasi: false,
  };
}
