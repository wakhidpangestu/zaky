import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import SitePage from '@/components/site/site-page';

export const metadata = { title: 'Halaman tidak ditemukan' };

export default function NotFound() {
  return (
    <SitePage>
      <section className="zs-split">
        <div>
          <span className="zs-eyebrow">Galat 404</span>
          <h1 className="zs-title">
            Ruangan ini <em>tidak ada di gedung kami.</em>
          </h1>
          <p className="zs-lead">
            Alamatnya mungkin salah ketik atau halamannya sudah dipindah. Kembali ke beranda, atau
            periksa kode catatan Anda langsung.
          </p>
          <div className="zs-actions" style={{ marginTop: 28 }}>
            <Link href="/" className="zs-btn">
              <ArrowLeft size={17} /> Ke beranda
            </Link>
            <Link href="/verifikasi" className="zs-btn zs-btn-ghost">
              <Search size={17} /> Cek kode catatan
            </Link>
          </div>
        </div>
        <figure className="zs-art">
          <Image
            src="/scenes/penyaluran.webp"
            alt="Lorong pusat layanan Zaky"
            width={1400}
            height={1328}
            priority
          />
        </figure>
      </section>
    </SitePage>
  );
}
