import localFont from 'next/font/local';

// next/font: self-hosted, di-preload, dan fallback metrik-tersesuaikan
// (size-adjust) sehingga pergantian font tidak menggeser tata letak (CLS).
export const outfit = localFont({
  src: [
    { path: './fonts/outfit-latin-400-normal.woff2', weight: '400' },
    { path: './fonts/outfit-latin-500-normal.woff2', weight: '500' },
    { path: './fonts/outfit-latin-600-normal.woff2', weight: '600' },
    { path: './fonts/outfit-latin-700-normal.woff2', weight: '700' },
    { path: './fonts/outfit-latin-800-normal.woff2', weight: '800' },
  ],
  variable: '--font-outfit',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

export const jetbrainsMono = localFont({
  src: [
    { path: './fonts/jetbrains-mono-latin-400-normal.woff2', weight: '400' },
    { path: './fonts/jetbrains-mono-latin-500-normal.woff2', weight: '500' },
  ],
  variable: '--font-jetbrains',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});
