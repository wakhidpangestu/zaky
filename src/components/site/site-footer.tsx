'use client';

import HalftoneWordmarkFooter, { type FooterColumn } from '@/components/ui/halftone-wordmark-footer';
import { jetbrainsMono, outfit } from '@/app/fonts';

const FOOTER_PALETTE = { background: '#15281f', ink: '#fbfbf8', warm: '#facc14' };

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Layanan',
    links: [
      { label: 'Pelacakan', href: '/#alur' },
      { label: 'Alat kerja', href: '/#layanan' },
      { label: 'Peran', href: '/#peran' },
      { label: 'Cara kerja', href: '/#cara-kerja' },
    ],
  },
  {
    title: 'Ruang Kerja',
    links: [
      { label: 'Masuk amil', href: '/login' },
      { label: 'Dasbor pos dana', href: '/dasbor' },
      { label: 'Zaky Simulator', href: '/dasbor?mode=3d' },
      { label: 'Profil amil', href: '/profil' },
    ],
  },
  {
    title: 'Keterbukaan',
    links: [
      { label: 'Cek Kode Publik', href: '/verifikasi' },
      { label: 'Papan Silang P2P', href: '/silang' },
      { label: 'Dokumentasi Sistem', href: '/docs' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <HalftoneWordmarkFooter
      wordmark="zaky"
      label="Zaky · Catat amanah, saling menjaga"
      meta="© 2026 · Ilustrasi menjelaskan proses; aktivitas nyata mengikuti data lembaga"
      columns={FOOTER_COLUMNS}
      backToTopLabel="Kembali ke atas"
      palette={FOOTER_PALETTE}
      fontFamily={`${outfit.style.fontFamily}, system-ui, sans-serif`}
      monoFamily={`${jetbrainsMono.style.fontFamily}, ui-monospace, monospace`}
      wordmarkScale={0.82}
      crop={0.18}
      height="max(clamp(500px, 36vw, 540px), calc(620px - 18vw))"
    />
  );
}
