/**
 * Application Use Case: Persetujuan Penyaluran (Approval Final)
 * Sesuai FR-29 s/d FR-31, ADR-01, ADR-03, Bab 7.4
 *
 * Urutan Transaksi Terkunci:
 * 1. kunci pos_dana (FOR UPDATE)
 * 2. kunci penyaluran (FOR UPDATE)
 * 3. periksa status = dikonfirmasi
 * 4. periksa segregasi 4-mata (penyetuju != pembuat, unit != pembuat, bukan saksi)
 * 5. status = disetujui (keputusan tercatat; saldo BELUM berpindah)
 * 6. penyelesaian terpisah: saldo_dicadangkan -= nominal, total_tersalurkan += nominal
 * 7. status = tersalurkan
 * 8. tulis_log (kunci rantai_kepala urutan terakhir)
 *
 * Perbaikan audit S4: alur kini benar-benar melewati status 'disetujui'
 * (sebelumnya melompat dikonfirmasi -> tersalurkan sehingga status
 * 'disetujui' tidak pernah dihasilkan lapisan TypeScript).
 */

import { type StatusPenyaluran, type PelakuAksi, validasiSegregasiKewenangan } from '../../domain/mesin-status.ts';
import { type PosDanaData, selesaikanPenyaluran } from '../../domain/invariant.ts';

export interface SetujuiPenyaluranCommand {
  penyaluranId: string;
  nominal: number;
  statusSaatIni: StatusPenyaluran;
  posDana: PosDanaData;
  pembuat: PelakuAksi;
  penyetuju: PelakuAksi;
  saksiList?: PelakuAksi[];
}

export interface HasilPersetujuan {
  penyaluranId: string;
  statusBaru: StatusPenyaluran;
  posDanaBaru: PosDanaData;
  disetujuiPada: string;
  pesan: string;
}

export function eksekusiPersetujuan(cmd: SetujuiPenyaluranCommand): HasilPersetujuan {
  const { penyaluranId, nominal, statusSaatIni, posDana, pembuat, penyetuju, saksiList = [] } = cmd;

  if (penyetuju.peran !== 'penyetuju') {
    throw new Error('Hanya akun berotoritas Penyetuju yang dapat menyahkan penyaluran zakat.');
  }

  if (statusSaatIni !== 'dikonfirmasi') {
    throw new Error(
      `Penyaluran tidak dapat disetujui karena status saat ini '${statusSaatIni}' (harus 'dikonfirmasi').`
    );
  }

  // Validasi Segregasi 4-Mata (ADR-08, FR-30)
  const segregasi = validasiSegregasiKewenangan({
    pembuat,
    penyetuju,
    saksiList,
  });

  if (!segregasi.valid) {
    throw new Error(segregasi.pelanggaran);
  }

  // Keputusan persetujuan dicatat sebagai status 'disetujui'. Saldo sengaja
  // BELUM berpindah pada langkah ini; perpindahan saldo adalah tindakan
  // penyelesaian terpisah (eksekusiPenyelesaianPenyaluran) agar jejak
  // keputusan dan jejak pembukuan tidak tercampur.
  return {
    penyaluranId,
    statusBaru: 'disetujui',
    posDanaBaru: posDana,
    disetujuiPada: new Date().toISOString(),
    pesan: 'Penyaluran disetujui. Menunggu penyelesaian pembukuan ke saldo tersalurkan.',
  };
}

export interface SelesaikanPenyaluranCommand {
  penyaluranId: string;
  nominal: number;
  statusSaatIni: StatusPenyaluran;
  posDana: PosDanaData;
}

/**
 * Penyelesaian pembukuan: hanya sah dari status 'disetujui'.
 * Memindahkan saldo dicadangkan -> total tersalurkan dan menghasilkan
 * status akhir 'tersalurkan'.
 */
export function eksekusiPenyelesaianPenyaluran(
  cmd: SelesaikanPenyaluranCommand
): HasilPersetujuan {
  const { penyaluranId, nominal, statusSaatIni, posDana } = cmd;

  if (statusSaatIni !== 'disetujui') {
    throw new Error(
      `Penyelesaian tidak dapat diproses karena status saat ini '${statusSaatIni}' (harus 'disetujui').`
    );
  }

  const { posBaru, hasilUji } = selesaikanPenyaluran(posDana, nominal);
  if (!hasilUji.valid) {
    throw new Error(hasilUji.error || 'Pelanggaran invariant saldo saat penyelesaian penyaluran.');
  }

  return {
    penyaluranId,
    statusBaru: 'tersalurkan',
    posDanaBaru: posBaru,
    disetujuiPada: new Date().toISOString(),
    pesan: 'Penyaluran berhasil diselesaikan. Dana telah resmi dibukukan sebagai tersalurkan.',
  };
}
