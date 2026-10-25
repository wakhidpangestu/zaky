import { jcsBuffer } from '../kripto/jcs.ts';
import { signEd25519, verifyEd25519 } from '../kripto/ed25519.ts';

export interface KesaksianPayload {
  saksi_lembaga_id: string;
  lembaga_id: string;
  tanggal: string; // YYYY-MM-DD
  hash_disaksikan: string; // Hex string (32 bytes SHA-256)
  diamati_pada: string; // ISO 8601 UTC
}

export interface KesaksianLengkap extends KesaksianPayload {
  tanda_tangan_saksi: string; // Hex string signature Ed25519
}

/**
 * Membuat paket kesaksian silang yang ditandatangani dengan Ed25519
 */
export function tandaTanganiKesaksian(
  params: KesaksianPayload,
  privateKeyPem: string
): KesaksianLengkap {
  if (params.saksi_lembaga_id === params.lembaga_id) {
    throw new Error('Lembaga tidak dapat menjadi saksi atas dirinya sendiri (CHECK saksi_lembaga_id <> lembaga_id).');
  }

  const payloadBuf = jcsBuffer(params);
  const signature = signEd25519(payloadBuf, privateKeyPem);

  return {
    ...params,
    tanda_tangan_saksi: signature.toString('hex'),
  };
}

/**
 * Memverifikasi tanda tangan kesaksian silang
 */
export function verifikasiTandaTanganKesaksian(
  kesaksian: KesaksianLengkap,
  kunciPublikHex: string
): boolean {
  if (kesaksian.saksi_lembaga_id === kesaksian.lembaga_id) {
    return false;
  }

  const payload: KesaksianPayload = {
    saksi_lembaga_id: kesaksian.saksi_lembaga_id,
    lembaga_id: kesaksian.lembaga_id,
    tanggal: kesaksian.tanggal,
    hash_disaksikan: kesaksian.hash_disaksikan,
    diamati_pada: kesaksian.diamati_pada,
  };

  const payloadBuf = jcsBuffer(payload);
  return verifyEd25519(payloadBuf, kesaksian.tanda_tangan_saksi, kunciPublikHex);
}
