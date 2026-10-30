/**
 * Test Suite: Kriptografi Zaky (JCS RFC 8785, Ed25519, SHA-256, HMAC)
 * Sesuai Bab 10.2, Bab 12, dan ADR-06
 */

import { kanonikalJson, jcsBuffer } from '../../src/infrastructure/kripto/jcs.ts';
import { generateEd25519KeyPair, signEd25519, verifyEd25519 } from '../../src/infrastructure/kripto/ed25519.ts';
import { sha256Hex } from '../../src/infrastructure/kripto/sha256.ts';
import { hmacTelepon, cocokkanHmacTelepon } from '../../src/infrastructure/kripto/hmac.ts';

function runKriptoTests() {
  console.log('--- [TEST] 1. Deterministic JSON Canonicalization (RFC 8785) ---');
  const objA = { z: 1, a: 'test', m: { b: 2, a: 1 } };
  const objB = { a: 'test', m: { a: 1, b: 2 }, z: 1 };

  const jcsA = kanonikalJson(objA);
  const jcsB = kanonikalJson(objB);

  if (jcsA !== jcsB) {
    throw new Error(`JCS tidak deterministik! \nA: ${jcsA}\nB: ${jcsB}`);
  }
  if (jcsA !== '{"a":"test","m":{"a":1,"b":2},"z":1}') {
    throw new Error(`Hasil JCS tidak sesuai urutan leksikografis: ${jcsA}`);
  }
  console.log('✓ Serialisasi JCS deterministik identik terlepas dari urutan kunci asli.');

  console.log('--- [TEST] 2. Ed25519 Sign & Verify ---');
  const keyPair = generateEd25519KeyPair();
  const testPayload = jcsBuffer({ lembaga: 'LEMBAGA_A', hash: 'abc12345', status: 'SAH' });

  const signature = signEd25519(testPayload, keyPair.privateKeyPem);
  const isValid = verifyEd25519(testPayload, signature, keyPair.publicKeyHex);

  if (!isValid) {
    throw new Error('Verifikasi tanda tangan Ed25519 gagal');
  }

  // Uji Tamper pada Payload
  const tamperedPayload = jcsBuffer({ lembaga: 'LEMBAGA_A', hash: 'abc12345_TAMPERED', status: 'SAH' });
  const isTamperedValid = verifyEd25519(tamperedPayload, signature, keyPair.publicKeyHex);

  if (isTamperedValid) {
    throw new Error('Tanda tangan tidak boleh valid pada payload yang dimanipulasi!');
  }
  console.log('✓ Ed25519 tanda tangan dan deteksi manipulasi payload sukses.');

  console.log('--- [TEST] 3. HMAC-SHA256 Penyamaran Data Pribadi Mustahik ---');
  const phone = '0812-3456-7890';
  const pepper = 'lembaga-a-secret-pepper';
  const hmacBuf = hmacTelepon(phone, pepper);

  if (!cocokkanHmacTelepon('081234567890', hmacBuf, pepper)) {
    throw new Error('Pencocokan HMAC nomor telepon gagal untuk format yang dinormalisasi');
  }
  if (cocokkanHmacTelepon('081299999999', hmacBuf, pepper)) {
    throw new Error('Nomor berbeda tidak boleh cocok dengan HMAC');
  }
  console.log('✓ HMAC-SHA256 perlindungan privasi PDP terverifikasi.');

  console.log('\nSEMUA PENGUJIAN KRIPTOGRAFI SUKSES!');
}

runKriptoTests();
