import { ogImage, ogSize } from '@/lib/og-image';

export const alt = 'Zaky — papan silang antarlembaga';
export const size = ogSize;
export const contentType = 'image/png';

export default function Image() {
  return ogImage({ eyebrow: 'Papan silang', title: 'Saling Menyaksikan.', accent: 'Antarlembaga.' });
}
