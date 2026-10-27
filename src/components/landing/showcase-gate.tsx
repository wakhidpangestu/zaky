'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Laboratorium interaktif adalah pulau klien terberat di landing. Ia hanya
// dipasang (dan dihidrasi) ketika pengunjung mendekatinya - penghematan
// besar di utas utama saat muat awal. Kerangka statis di bawah menempati
// tinggi yang sama (terukur: 1777px HP / 1036px desktop) agar tidak ada
// pergeseran tata letak ketika komponen asli terpasang.
const InteractiveShowcase = dynamic(() => import('@/components/landing/interactive-showcase'), {
  ssr: false,
});

export default function ShowcaseGate() {
  const [mount, setMount] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setMount(true);
          obs.disconnect();
        }
      },
      { rootMargin: '1500px 0px' }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  if (mount) {
    return <InteractiveShowcase />;
  }

  return (
    <div ref={ref}>
      <section
        id="simulator"
        className="py-20 md:py-28 bg-[#F7F4ED] border-b border-neutral-300/80 relative scroll-mt-24 min-h-[1777px] md:min-h-[1036px]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="z-display-2 text-neutral-900">Uji Langsung 3 Pilar Keamanan Zaky</h2>
            <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
              Rasakan langsung bagaimana mekanisme matematis dan kriptografis Zaky melindungi dana zakat
              tanpa memberi ruang bagi penyalahgunaan wewenang atau manipulasi database.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
