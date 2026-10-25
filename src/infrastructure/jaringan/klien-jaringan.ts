import { KesaksianLengkap } from './kesaksian';
import { generateRandomToken } from '../kripto/sha256';
import { signEd25519 } from '../kripto/ed25519';

export interface HashHarianResponse {
  versi: number;
  lembaga_id: string;
  tanggal: string;
  hash_kepala: string;
  jumlah_entri: number;
  tanda_tangan: string;
  kunci_id: string;
  diterbitkan_pada: string;
}

const TIMEOUT_MS = 3000; // 3 detik batas waktu koneksi (AV-04)

/**
 * Mengambil hash harian dari instance peer
 */
export async function ambilHashHarian(
  baseUrl: string,
  lembagaId: string,
  tanggal: string
): Promise<HashHarianResponse> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/publik/hash-harian/${lembagaId}/${tanggal}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil hash harian (${res.status} ${res.statusText}) dari ${url}`);
    }

    return (await res.json()) as HashHarianResponse;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mengirim kesaksian silang bertanda tangan ke peer instance
 * Menggunakan nonce dan waktu untuk mencegah serangan replay (Sec 10.3)
 */
export async function kirimKesaksian(
  baseUrl: string,
  kesaksian: KesaksianLengkap,
  privateKeyPem: string
): Promise<{ success: boolean; pesan?: string }> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/jaringan/kesaksian`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const timestamp = new Date().toISOString();
  const nonce = generateRandomToken(16);
  const authHeaderPayload = `${timestamp}:${nonce}`;
  const authSignature = signEd25519(authHeaderPayload, privateKeyPem).toString('hex');

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Zaky-Timestamp': timestamp,
        'X-Zaky-Nonce': nonce,
        'X-Zaky-Signature': authSignature,
      },
      body: JSON.stringify(kesaksian),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Pengiriman kesaksian gagal (${res.status}): ${errBody}`);
    }

    return (await res.json()) as { success: boolean; pesan?: string };
  } finally {
    clearTimeout(timer);
  }
}
