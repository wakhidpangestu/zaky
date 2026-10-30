import type { Metadata, Viewport } from 'next';
import { jetbrainsMono, outfit } from './fonts';
import './globals.css';
import './scroll-motion.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Zaky — Jaringan Verifikasi Penyaluran Zakat',
    template: '%s — Zaky',
  },
  description:
    'Sistem pencatatan penyaluran zakat dengan kesaksian antarlembaga dan konfirmasi penerima.',
  applicationName: 'Zaky',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Zaky',
  },
  twitter: { card: 'summary_large_image' },
  appleWebApp: { title: 'Zaky', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#0F5C4D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
