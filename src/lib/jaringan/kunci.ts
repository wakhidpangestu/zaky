import crypto from 'node:crypto';

export type KodeLembaga = 'A' | 'B' | 'C';

/** Anggota jaringan saksi. Hanya Lembaga A yang buku besarnya ada di basis data ini. */
export const LEMBAGA: Record<KodeLembaga, { id: string; nama: string; kota: string }> = {
  A: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', nama: 'Lembaga Zakat A', kota: 'Jakarta Pusat' },
  B: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', nama: 'Lembaga Amil Zakat Peduli B', kota: 'Bandung' },
  C: { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', nama: 'Lembaga Amil Zakat Amanah C', kota: 'Surabaya' },
};

// PKCS#8 header for a raw 32-byte Ed25519 seed.
const PKCS8_ED25519 = Buffer.from('302e020100300506032b657004220420', 'hex');

/**
 * Signing key of a network member. Production sets ZAKY_ED25519_SEED_<A|B|C> (64 hex
 * chars). Without it a DEMO seed is derived from a public string: anyone can recompute
 * it, so signatures made with it prove the mechanism, not identity. `demo` says which.
 */
export function kunciLembaga(kode: KodeLembaga): { privateKey: crypto.KeyObject; demo: boolean } {
  const env = process.env[`ZAKY_ED25519_SEED_${kode}`];
  const fromEnv = env && /^[0-9a-f]{64}$/i.test(env) ? Buffer.from(env, 'hex') : null;
  const seed = fromEnv ?? crypto.createHash('sha256').update(`zaky-demo-ed25519:LEMBAGA_${kode}`).digest();
  const privateKey = crypto.createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519, seed]),
    format: 'der',
    type: 'pkcs8',
  });
  return { privateKey, demo: !fromEnv };
}

export function tandaTangani(kode: KodeLembaga, payload: Buffer): Buffer {
  return crypto.sign(null, payload, kunciLembaga(kode).privateKey);
}
