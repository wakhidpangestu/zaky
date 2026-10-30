import { ogImage, ogSize } from '@/lib/og-image';

export const alt = 'Zaky — zakat tercatat, amanah terjaga';
export const size = ogSize;
export const contentType = 'image/png';

export default function Image() {
  return ogImage({ eyebrow: 'Amanah yang bisa ditelusuri', title: 'Zakat Tercatat.', accent: 'Amanah Terjaga.' });
}
