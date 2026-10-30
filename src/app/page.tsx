import ReferenceHome from '@/components/journey/reference-home';

export const metadata = {
  // absolute: the layout's "%s — Zaky" template would repeat the name
  title: { absolute: 'Zaky | Setiap Lembaga Mencatat Sendiri, Catatannya Saling Diperiksa' },
  description:
    'Jaringan verifikasi penyaluran zakat antarlembaga berlandaskan fiqih amanah, konfirmasi langsung penerima (mustahik), dan audit silang kriptografis harian.',
};

// Statis: status masuk dibaca navbar di klien, bukan dari cookie saat render.
export default function HomePage() {
  return <ReferenceHome />;
}
