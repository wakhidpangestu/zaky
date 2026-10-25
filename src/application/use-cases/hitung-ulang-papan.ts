/**
 * Application Use Case: Hitung Ulang Papan Silang Antarlembaga
 * Sesuai Bab 8.3, ADR-07, FR-46 s/d FR-55
 */

import {
  EntriLogAudit,
  verifikasiSilang,
  HasilVerifikasiRantai,
} from '../../infrastructure/log/verifikasi-rantai';
import { cariAnggota } from '../../infrastructure/jaringan/direktori';
import { verifikasiTandaTanganKesaksian, KesaksianLengkap } from '../../infrastructure/jaringan/kesaksian';

export interface HitungUlangPapanCommand {
  lembagaId: string;
  tanggal: string;
  daftarLogAudit: EntriLogAudit[];
  hashHarianTerbit?: {
    hash_kepala: string;
    jumlah_entri: number;
    tanda_tangan: string;
  };
  daftarKesaksian: KesaksianLengkap[];
}

export function eksekusiHitungUlangPapan(cmd: HitungUlangPapanCommand): HasilVerifikasiRantai {
  const { lembagaId, tanggal, daftarLogAudit, hashHarianTerbit, daftarKesaksian } = cmd;

  if (!hashHarianTerbit) {
    return {
      status: 'Belum diterbitkan',
      valid: false,
      totalEntriDihitung: 0,
      hashKepalaTerhitung: '',
      hashKepalaTerbit: '',
      jumlahKesaksianValid: 0,
      rincianPemeriksaan: {
        integritasInternalLog: false,
        cocokDenganHashTerbit: false,
        kesaksianPeerCocok: false,
        keterangan: `Lembaga belum menerbitkan hash harian untuk tanggal ${tanggal}.`,
      },
    };
  }

  // Verifikasi keabsahan tanda tangan setiap saksi menggunakan direktori anggota
  const validSaksiHashes: string[] = [];

  for (const k of daftarKesaksian) {
    const infoSaksi = cariAnggota(k.saksi_lembaga_id);
    if (!infoSaksi) continue;

    const signatureValid = verifikasiTandaTanganKesaksian(k, infoSaksi.kunci_publik_ed25519);
    if (signatureValid) {
      validSaksiHashes.push(k.hash_disaksikan);
    }
  }

  return verifikasiSilang({
    daftarEntri: daftarLogAudit,
    jumlahEntri: hashHarianTerbit.jumlah_entri,
    hashKepalaTerbit: hashHarianTerbit.hash_kepala,
    daftarHashDisaksikanSaksi: validSaksiHashes,
  });
}
