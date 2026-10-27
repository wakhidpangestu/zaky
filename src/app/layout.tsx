import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Plus Jakarta Sans dimuat lewat next/font: berkas latin di-preload dan
// font-display diatur eksplisit agar teks hero (LCP) melukis sedini mungkin
// tanpa menunggu rantai CSS @fontsource.
const jakarta = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-jakarta',
  display: 'swap',
});

// JetBrains Mono (teks data/hash) dan Caveat (anotasi tulisan tangan) dimuat
// lewat next/font TANPA preload: keduanya bukan font jalur kritis. Audit
// PageSpeed menempatkan woff2 Caveat 600 (50 KiB) dan JetBrains Mono pada
// rantai kritis LCP karena dimuat lewat rantai CSS @fontsource; kini browser
// mengambilnya berprioritas rendah setelah lukisan pertama. Caveat memakai
// display 'optional' karena murni dekoratif - bila jaringan lambat, anotasi
// tampil dengan font cadangan dan tidak menahan Speed Index.
const jetbrains = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-jetbrains',
  display: 'swap',
  preload: false,
});

const caveat = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/caveat/files/caveat-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/caveat/files/caveat-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-caveat',
  display: 'optional',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Zaky — Jaringan Verifikasi Penyaluran Zakat',
  description:
    'Sistem pencatatan penyaluran zakat dengan kesaksian antarlembaga dan konfirmasi penerima.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', sizes: 'any' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${jetbrains.variable} ${caveat.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
