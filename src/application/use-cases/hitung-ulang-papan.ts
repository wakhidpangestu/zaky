/**
 * Application Use Case: Hitung Ulang Papan Silang Antarlembaga
 * Sesuai Bab 8.3, ADR-07, FR-46 s/d FR-55
 */

import {
  type EntriLogAudit,
  verifikasiSilang,
  type HasilVerifikasiRantai,
} from '../../infrastructure/log/verifikasi-rantai.ts';
import { cariAnggota } from '../../infrastructure/jaringan/direktori.ts';
import { verifikasiTandaTanganKesaksian, type KesaksianLengkap } from '../../infrastructure/jaringan/kesaksian.ts';

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

  // Verifikasi keabsahan tanda tangan setiap saksi menggunakan direktori anggota.
  // Dedupe per lembaga saksi (audit S3): satu lembaga hanya boleh menyumbang
  // SATU suara kuorum - kesaksian ganda dari saksi yang sama tidak dihitung
  // berulang untuk memenuhi syarat minimal 2 saksi independen.
  const validSaksiHashes: string[] = [];
  const saksiSudahDihitung = new Set<string>();

  for (const k of daftarKesaksian) {
    if (saksiSudahDihitung.has(k.saksi_lembaga_id)) continue;

    const infoSaksi = cariAnggota(k.saksi_lembaga_id);
    if (!infoSaksi) continue;

    const signatureValid = verifikasiTandaTanganKesaksian(k, infoSaksi.kunci_publik_ed25519);
    if (signatureValid) {
      saksiSudahDihitung.add(k.saksi_lembaga_id);
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
