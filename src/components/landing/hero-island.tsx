'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import HeroFallback from '@/components/landing/hero-fallback';

// Journey 3D (Three.js, chunk terbesar) dimuat lazy di sisi klien saja.
// Selama chunk dimuat, hero statis bergaya referensi tampil lebih dulu (LCP cepat),
// dan hero yang sama menjadi fallback permanen bila WebGL2 tidak tersedia.
const ZakyJourney3D = dynamic(() => import('@/components/landing/zaky-journey-3d'), {
  ssr: false,
  loading: () => <HeroFallback mode="loading" />,
});

/**
 * Pulau klien untuk hero: menunda pemasangan journey 3D sampai interaksi
 * pertama pengguna (gulir/sentuh/klik/tombol - memang begitu journey
 * dikonsumsi) atau 9 detik setelah load. Selama menunggu, trek 440vh dengan
 * hero statis menempati geometri yang persis sama dengan journey asli
 * sehingga tidak ada pergeseran tata letak (CLS). Sisanya dari landing
 * adalah komponen server agar hidrasi awal seminimal mungkin.
 */
export default function HeroIsland() {
  const [mount3D, setMount3D] = useState(false);

  useEffect(() => {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      window.removeEventListener('wheel', mount);
      window.removeEventListener('touchstart', mount);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', mount);
      if (timer) clearTimeout(timer);
    };
    // Klik pada elemen interaktif (tombol/tautan/input) TIDAK memicu pasang:
    // klik itu harus menjalankan tugasnya sendiri (mis. membuka modal akad),
    // bukan ditelan oleh pergantian fallback -> 3D di tengah klik.
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest('button, a, input, select, textarea, label, [role="button"]')) {
        return;
      }
      mount();
    };
    const mount = () => {
      if (!done) {
        done = true;
        cleanup();
        setMount3D(true);
      }
    };

    window.addEventListener('wheel', mount, { passive: true });
    window.addEventListener('touchstart', mount, { passive: true });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', mount);

    const startTimer = () => {
      timer = setTimeout(mount, 9000);
    };
    if (document.readyState === 'complete') {
      startTimer();
    } else {
      window.addEventListener('load', startTimer, { once: true });
    }
    return () => {
      window.removeEventListener('load', startTimer);
      cleanup();
    };
  }, []);

  const openAkadModal = () => {
    window.dispatchEvent(new CustomEvent('zaky:open-akad'));
  };

  if (mount3D) {
    return <ZakyJourney3D onOpenAkadModal={openAkadModal} />;
  }

  return (
    <div className="relative w-full" style={{ height: '440vh' }}>
      <div className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden">
        <HeroFallback mode="loading" />
      </div>
    </div>
  );
}
