/**
 * JSON Canonicalization Scheme (JCS) - Sesuai RFC 8785
 * Menjamin serialisasi deterministik agar verifikator independen
 * menghasilkan digest biner yang persis sama (ADR-06).
 */

export function kanonikalJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const elements = obj.map((item) => kanonikalJson(item));
    return `[${elements.join(',')}]`;
  }

  // Objek: Urutkan kunci secara leksikografis berdasarkan kode UTF-16
  const sortedKeys = Object.keys(obj).sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  const pairs = sortedKeys.map((key) => {
    const val = obj[key];
    return `${JSON.stringify(key)}:${kanonikalJson(val)}`;
  });

  return `{${pairs.join(',')}}`;
}

/**
 * Menghasilkan Buffer UTF-8 dari representasi JCS
 */
export function jcsBuffer(obj: any): Buffer {
  return Buffer.from(kanonikalJson(obj), 'utf8');
}
