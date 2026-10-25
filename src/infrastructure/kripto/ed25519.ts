import crypto from 'crypto';

export interface Ed25519KeyPair {
  publicKeyHex: string;
  privateKeyPem: string;
  publicKeyPem: string;
}

/**
 * Menghasilkan pasangan kunci Ed25519 baru
 */
export function generateEd25519KeyPair(): Ed25519KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Ekstrak 32-byte raw public key untuk hex presentation
  const rawKeyObj = crypto.createPublicKey(publicKey);
  const rawBuffer = rawKeyObj.export({ type: 'spki', format: 'der' });
  // ASN.1 SPKI header for Ed25519 is 12 bytes: 302a300506032b6570032100 followed by 32 bytes raw key
  const raw32 = rawBuffer.subarray(rawBuffer.length - 32);

  return {
    publicKeyHex: raw32.toString('hex'),
    privateKeyPem: privateKey,
    publicKeyPem: publicKey,
  };
}

/**
 * Menandatangani payload menggunakan private key Ed25519
 */
export function signEd25519(
  payload: Buffer | string,
  privateKeyPem: string
): Buffer {
  const bufferData = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
  return crypto.sign(null, bufferData, privateKeyPem);
}

/**
 * Memverifikasi tanda tangan Ed25519
 */
export function verifyEd25519(
  payload: Buffer | string,
  signature: Buffer | string,
  publicKeyPemOrHex: string
): boolean {
  try {
    const bufferData = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
    const signatureBuffer = typeof signature === 'string' ? Buffer.from(signature, 'hex') : signature;

    let keyObject: crypto.KeyObject;

    if (publicKeyPemOrHex.includes('BEGIN PUBLIC KEY')) {
      keyObject = crypto.createPublicKey(publicKeyPemOrHex);
    } else {
      // 32-byte raw hex: bungkus kembali ke DER SPKI format
      const raw32 = Buffer.from(publicKeyPemOrHex, 'hex');
      const spkiHeader = Buffer.from('302a300506032b6570032100', 'hex');
      const derBuffer = Buffer.concat([spkiHeader, raw32]);
      keyObject = crypto.createPublicKey({
        key: derBuffer,
        format: 'der',
        type: 'spki',
      });
    }

    return crypto.verify(null, bufferData, keyObject, signatureBuffer);
  } catch (err) {
    return false;
  }
}
