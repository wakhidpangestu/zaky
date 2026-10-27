'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Modal akad (kalkulator 5 langkah) tidak perlu dihidrasi sebelum ada yang
// membukanya: gerbang mungil ini hanya mendengarkan event 'zaky:open-akad',
// dan saat event pertama tiba, modal asli dipasang lalu event dipancarkan
// ulang agar pendengar di dalam modal (yang baru terpasang) ikut membukanya.
const AkadModal = dynamic(() => import('@/components/landing/akad-modal'), {
  ssr: false,
});

export default function AkadGate() {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    if (mount) return;
    const onOpen = () => {
      setMount(true);
      // Modal memasang pendengarnya sendiri saat mount; pancarkan ulang
      // event pembuka ini beberapa kali (membuka modal yang sudah terbuka
      // tidak berpengaruh) agar klik pertama tetap membukanya begitu chunk
      // modal selesai dimuat dan pendengarnya terdaftar.
      for (const jeda of [150, 400, 800]) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('zaky:open-akad'));
        }, jeda);
      }
    };
    window.addEventListener('zaky:open-akad', onOpen);
    return () => window.removeEventListener('zaky:open-akad', onOpen);
  }, [mount]);

  if (!mount) return null;
  return <AkadModal />;
}
