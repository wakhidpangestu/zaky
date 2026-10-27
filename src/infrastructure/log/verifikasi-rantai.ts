/**
 * Log Chain Verification & Independent Recalculation Engine
 * Sesuai Bab 8.3, Bab 12, dan FR-46 s/d FR-48
 *
 * Mengapa hitung ulang penting:
 * Tanpa hitung ulang, sistem hanya membandingkan salinan hash tersimpan.
 * Hitung ulang dari entri 1..jumlah_entri membuat perubahan pada entri mana pun
 * langsung mengubah hash akhir (h_n) dan membongkar manipulasi database (ADR-07).
 */

import { kanonikalJson } from '../kripto/jcs.ts';
import { sha256Buffer } from '../kripto/sha256.ts';

export interface EntriLogAudit {
  nomor: number;
  lembaga_id: string;
  entitas: string;
  entitas_id: string;
  aksi: string;
  pelaku: string;
  sebelum?: any;
  sesudah?: any;
  waktu: string; // ISO 8601 UTC
  hash_sebelumnya: string; // Hex 64 chars
  hash_saat_ini: string; // Hex 64 chars
}

export interface HasilVerifikasiRantai {
  status: 'Terkonfirmasi' | 'Belum cukup saksi' | 'Tidak cocok' | 'Belum diterbitkan';
  valid: boolean;
  totalEntriDihitung: number;
  hashKepalaTerhitung: string;
  hashKepalaTerbit: string;
  jumlahKesaksianValid: number;
  rincianPemeriksaan: {
    integritasInternalLog: boolean;
    cocokDenganHashTerbit: boolean;
    kesaksianPeerCocok: boolean;
    titikKegagalanNomor?: number;
    keterangan: string;
  };
}

const HASH_NOL_32_BYTES = Buffer.alloc(32, 0);

/**
 * Menghitung ulang rantai hash SHA-256 dari log audit 1..jumlah_entri
 * Formula:
 * h_0 = 0x00...00 (32 bytes nol)
 * h_n = SHA-256(JCS(entri_n) || h_{n-1})
 */
export function hitungUlangRantaiLog(
  daftarEntri: EntriLogAudit[],
  jumlahEntriTarget: number
): {
  sukses: boolean;
  hashAkhirHex: string;
  entriBermasalah?: number;
  pesanError?: string;
} {
  // Urutkan entri berdasarkan nomor urut menaik
  const entriTerurut = [...daftarEntri]
    .filter((e) => e.nomor <= jumlahEntriTarget)
    .sort((a, b) => a.nomor - b.nomor);

  if (entriTerurut.length < jumlahEntriTarget) {
    return {
      sukses: false,
      hashAkhirHex: '',
      pesanError: `Entri log tidak lengkap. Ditemukan ${entriTerurut.length} dari ${jumlahEntriTarget} entri target.`,
    };
  }

  let prevHashBuffer: any = HASH_NOL_32_BYTES;

  for (let i = 0; i < jumlahEntriTarget; i++) {
    const entri = entriTerurut[i];
    const nomorSeharusnya = i + 1;

    if (entri.nomor !== nomorSeharusnya) {
      return {
        sukses: false,
        hashAkhirHex: '',
        entriBermasalah: entri.nomor,
        pesanError: `Urutan nomor log terputus pada indeks ${i}: terbaca nomor ${entri.nomor}, seharusnya ${nomorSeharusnya}.`,
      };
    }

    // Format serialisasi deterministik entri log audit
    const payloadObject = {
      aksi: entri.aksi,
      entitas: entri.entitas,
      entitas_id: entri.entitas_id,
      lembaga_id: entri.lembaga_id,
      nomor: entri.nomor,
      pelaku: entri.pelaku,
      sebelum: entri.sebelum || null,
      sesudah: entri.sesudah || null,
      waktu: entri.waktu,
    };

    const payloadUtf8 = Buffer.from(kanonikalJson(payloadObject), 'utf8');
    const combinedBuffer = Buffer.concat([payloadUtf8, prevHashBuffer]);
    const computedHashBuffer = sha256Buffer(combinedBuffer);
    const computedHashHex = computedHashBuffer.toString('hex');

    // Bandingkan dengan hash_saat_ini yang dicatat pada entri tersebut
    if (computedHashHex.toLowerCase() !== entri.hash_saat_ini.toLowerCase()) {
      return {
        sukses: false,
        hashAkhirHex: computedHashHex,
        entriBermasalah: entri.nomor,
        pesanError: `Tamper terdeteksi pada log nomor ${entri.nomor}! Hash terhitung (${computedHashHex.substring(0, 16)}...) tidak cocok dengan catatan (${entri.hash_saat_ini.substring(0, 16)}...).`,
      };
    }

    prevHashBuffer = computedHashBuffer;
  }

  return {
    sukses: true,
    hashAkhirHex: prevHashBuffer.toString('hex'),
  };
}

/**
 * Verifikasi menyeluruh Papan Silang (Cross-board verification)
 */
export function verifikasiSilang(params: {
  daftarEntri: EntriLogAudit[];
  jumlahEntri: number;
  hashKepalaTerbit: string;
  daftarHashDisaksikanSaksi: string[];
}): HasilVerifikasiRantai {
  const { daftarEntri, jumlahEntri, hashKepalaTerbit, daftarHashDisaksikanSaksi } = params;

  if (!hashKepalaTerbit) {
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
        keterangan: 'Hash harian untuk periode ini belum diterbitkan oleh lembaga.',
      },
    };
  }

  // 1. Hitung ulang rantai log
  const hasilHitung = hitungUlangRantaiLog(daftarEntri, jumlahEntri);
  if (!hasilHitung.sukses) {
    return {
      status: 'Tidak cocok',
      valid: false,
      totalEntriDihitung: daftarEntri.length,
      hashKepalaTerhitung: hasilHitung.hashAkhirHex,
      hashKepalaTerbit,
      jumlahKesaksianValid: 0,
      rincianPemeriksaan: {
        integritasInternalLog: false,
        cocokDenganHashTerbit: false,
        kesaksianPeerCocok: false,
        titikKegagalanNomor: hasilHitung.entriBermasalah,
        keterangan: hasilHitung.pesanError || 'Gagal menghitung ulang rantai log.',
      },
    };
  }

  // 2. Cocokkan hash terhitung dengan hash kepala terbit
  const cocokDenganTerbit =
    hasilHitung.hashAkhirHex.toLowerCase() === hashKepalaTerbit.toLowerCase();

  if (!cocokDenganTerbit) {
    return {
      status: 'Tidak cocok',
      valid: false,
      totalEntriDihitung: jumlahEntri,
      hashKepalaTerhitung: hasilHitung.hashAkhirHex,
      hashKepalaTerbit,
      jumlahKesaksianValid: 0,
      rincianPemeriksaan: {
        integritasInternalLog: true,
        cocokDenganHashTerbit: false,
        kesaksianPeerCocok: false,
        keterangan:
          'Inkonsistensi: Hash kepala terbit tidak cocok dengan kalkulasi ulang log audit basis data.',
      },
    };
  }

  // 3. Cocokkan dengan kesaksian peer
  const saksiCocokCount = daftarHashDisaksikanSaksi.filter(
    (h) => h.toLowerCase() === hashKepalaTerbit.toLowerCase()
  ).length;

  const adaSaksiTidakCocok = daftarHashDisaksikanSaksi.some(
    (h) => h.toLowerCase() !== hashKepalaTerbit.toLowerCase()
  );

  if (adaSaksiTidakCocok) {
    return {
      status: 'Tidak cocok',
      valid: false,
      totalEntriDihitung: jumlahEntri,
      hashKepalaTerhitung: hasilHitung.hashAkhirHex,
      hashKepalaTerbit,
      jumlahKesaksianValid: saksiCocokCount,
      rincianPemeriksaan: {
        integritasInternalLog: true,
        cocokDenganHashTerbit: true,
        kesaksianPeerCocok: false,
        keterangan: 'Peringatan Anomali: Terdapat kesaksian peer yang berselisih dengan hash lembaga!',
      },
    };
  }

  if (saksiCocokCount >= 2) {
    return {
      status: 'Terkonfirmasi',
      valid: true,
      totalEntriDihitung: jumlahEntri,
      hashKepalaTerhitung: hasilHitung.hashAkhirHex,
      hashKepalaTerbit,
      jumlahKesaksianValid: saksiCocokCount,
      rincianPemeriksaan: {
        integritasInternalLog: true,
        cocokDenganHashTerbit: true,
        kesaksianPeerCocok: true,
        keterangan: `Konsensus Sah P2P: diverifikasi penuh oleh kalkulasi ulang log dan ${saksiCocokCount} saksi silang independen.`,
      },
    };
  }

  return {
    status: 'Belum cukup saksi',
    // Audit S3: status ini berarti konsensus BELUM tercapai, jadi valid harus
    // false. Rantai internalnya sendiri utuh (lihat rincian), tetapi tanpa
    // kuorum 2 saksi independen hasilnya belum dapat dinyatakan sah.
    valid: false,
    totalEntriDihitung: jumlahEntri,
    hashKepalaTerhitung: hasilHitung.hashAkhirHex,
    hashKepalaTerbit,
    jumlahKesaksianValid: saksiCocokCount,
    rincianPemeriksaan: {
      integritasInternalLog: true,
      cocokDenganHashTerbit: true,
      kesaksianPeerCocok: false,
      keterangan: `Kalkulasi log valid, namun membutuhkan minimal 2 saksi silang (saat ini: ${saksiCocokCount}).`,
    },
  };
}
