/**
 * Application Use Case: Penerbitan Hash Harian (Cron 00:00 WIB)
 * Sesuai Bab 8.1, FR-38 s/d FR-41, ADR-04, ADR-06
 *
 * Mengunci rantai_kepala FOR SHARE (tidak pernah mengunci pos_dana)
 * Payload kanonikal JCS ditandatangani menggunakan Ed25519
 */

import { jcsBuffer } from '../../infrastructure/kripto/jcs.ts';
import { signEd25519 } from '../../infrastructure/kripto/ed25519.ts';

export interface PenerbitanHashCommand {
  lembagaId: string;
  tanggal: string; // YYYY-MM-DD
  hashKepala: string; // Hex string 32 bytes
  jumlahEntri: number;
  privateKeyPem: string;
  kunciId?: string;
}

export interface HasilPenerbitanHash {
  versi: number;
  lembaga_id: string;
  tanggal: string;
  hash_kepala: string;
  jumlah_entri: number;
  payload_jcs: string; // JSON string canonical
  tanda_tangan: string; // Hex string
  kunci_id: string;
  diterbitkan_pada: string;
}

export function eksekusiPenerbitanHashHarian(cmd: PenerbitanHashCommand): HasilPenerbitanHash {
  const { lembagaId, tanggal, hashKepala, jumlahEntri, privateKeyPem, kunciId = 'kunci-ed25519-v1' } = cmd;

  if (!lembagaId || !tanggal || !hashKepala) {
    throw new Error('Parameter penerbitan hash harian tidak lengkap.');
  }

  // Payload kanonikal JCS sesuai spesifikasi Bagian 8.1
  const payloadJcsObject = {
    hash_kepala: hashKepala.toLowerCase(),
    jumlah_entri: jumlahEntri,
    lembaga_id: lembagaId,
    tanggal,
    versi: 1,
  };

  const payloadBuffer = jcsBuffer(payloadJcsObject);
  const signatureBuffer = signEd25519(payloadBuffer, privateKeyPem);

  return {
    versi: 1,
    lembaga_id: lembagaId,
    tanggal,
    hash_kepala: hashKepala.toLowerCase(),
    jumlah_entri: jumlahEntri,
    payload_jcs: payloadBuffer.toString('utf8'),
    tanda_tangan: signatureBuffer.toString('hex'),
    kunci_id: kunciId,
    diterbitkan_pada: new Date().toISOString(),
  };
}
