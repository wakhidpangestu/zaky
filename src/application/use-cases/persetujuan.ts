/**
 * Application Use Case: Persetujuan Penyaluran (Approval Final)
 * Sesuai FR-29 s/d FR-31, ADR-01, ADR-03, Bab 7.4
 *
 * Urutan Transaksi Terkunci:
 * 1. kunci pos_dana (FOR UPDATE)
 * 2. kunci penyaluran (FOR UPDATE)
 * 3. periksa status = dikonfirmasi
 * 4. periksa segregasi 4-mata (penyetuju != pembuat, unit != pembuat, bukan saksi)
 * 5. saldo_dicadangkan -= nominal, total_tersalurkan += nominal
 * 6. status = tersalurkan
 * 7. tulis_log (kunci rantai_kepala urutan terakhir)
 */

import { StatusPenyaluran, PelakuAksi, validasiSegregasiKewenangan } from '../../domain/mesin-status';
import { PosDanaData, selesaikanPenyaluran } from '../../domain/invariant';

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

  // Pindahkan saldo dari dicadangkan ke total_tersalurkan secara atomik
  const { posBaru, hasilUji } = selesaikanPenyaluran(posDana, nominal);
  if (!hasilUji.valid) {
    throw new Error(hasilUji.error || 'Pelanggaran invariant saldo saat penyelesaian penyaluran.');
  }

  return {
    penyaluranId,
    statusBaru: 'tersalurkan',
    posDanaBaru: posBaru,
    disetujuiPada: new Date().toISOString(),
    pesan: 'Penyaluran berhasil disetujui secara sah. Dana telah resmi dibukukan sebagai tersalurkan.',
  };
}
