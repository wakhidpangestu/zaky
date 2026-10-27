export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export function validateEvidence(bytes: Uint8Array, mime: string): string | null {
  if (!bytes.length || bytes.length > MAX_EVIDENCE_BYTES)
    return 'Bukti harus berukuran 1 byte sampai 5 MB.';
  const starts = (signature: number[]) => signature.every((v, i) => bytes[i] === v);
  const text = (start: number, end: number) => new TextDecoder().decode(bytes.slice(start, end));
  const valid =
    mime === 'application/pdf'
      ? text(0, 5) === '%PDF-'
      : mime === 'image/png'
        ? starts([137, 80, 78, 71, 13, 10, 26, 10])
        : mime === 'image/jpeg'
          ? starts([255, 216, 255])
          : mime === 'image/webp'
            ? text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP'
            : false;
  return valid ? null : 'Isi berkas tidak cocok. Gunakan PDF, JPEG, PNG atau WebP yang valid.';
}
