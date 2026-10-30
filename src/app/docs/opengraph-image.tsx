import { ogImage, ogSize } from '@/lib/og-image';

export const alt = 'Zaky — dokumentasi';
export const size = ogSize;
export const contentType = 'image/png';

export default function Image() {
  return ogImage({ eyebrow: 'Dokumentasi', title: 'Cara Kerja Zaky.', accent: 'Dari Alur Hingga Arsitektur.' });
}
