import { ogImage, ogSize } from '@/lib/og-image';

export const alt = 'Zaky — verifikasi kode catatan';
export const size = ogSize;
export const contentType = 'image/png';

export default function Image() {
  return ogImage({ eyebrow: 'Verifikasi publik', title: 'Periksa Catatan.', accent: 'Tanpa Membuka Data Pribadi.' });
}
