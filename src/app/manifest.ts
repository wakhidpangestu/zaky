import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zaky | Jaringan Verifikasi Penyaluran Zakat',
    short_name: 'Zaky',
    description:
      'Pencatatan penyaluran zakat dengan kesaksian antarlembaga dan konfirmasi penerima.',
    lang: 'id',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF9F5',
    theme_color: '#0F5C4D',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
