import type { Metadata } from 'next';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/600.css';
import './globals.css';

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
    <html lang="id">
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
