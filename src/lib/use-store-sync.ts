'use client';

import { useEffect, useRef } from 'react';

/**
 * Auto-sinkron data store lokal (localStorage) ke tampilan halaman.
 *
 * Memanggil ulang `reload` hanya bila isi store benar-benar berubah, dipicu oleh:
 * - event `zaky_store_updated` (perubahan dari tab/jendela yang sama),
 * - event `storage` (perubahan dari tab/jendela lain),
 * - tab kembali aktif / jendela kembali fokus (menangkap perubahan saat ditinggal),
 * - pemeriksaan berkala ringan selama tab terlihat (skenario menunggu perubahan
 *   status, mis. penyaluran yang baru disetujui admin di perangkat yang sama).
 *
 * Pemeriksaan perubahan memakai sidik jari isi ketiga kunci store, sehingga
 * pemicu yang tidak membawa perubahan tidak memicu render ulang.
 */

const STORE_KEYS = ['zaky_pos_dana', 'zaky_penerimaan', 'zaky_penyaluran'];

function storeFingerprint(): string {
  try {
    return STORE_KEYS.map((k) => localStorage.getItem(k) ?? '').join('');
  } catch {
    return '';
  }
}

export function useStoreSync(reload: () => void, intervalMs = 8000): void {
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const fingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    fingerprintRef.current = storeFingerprint();

    const check = () => {
      const now = storeFingerprint();
      if (fingerprintRef.current !== null && now !== fingerprintRef.current) {
        fingerprintRef.current = now;
        reloadRef.current();
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === null || STORE_KEYS.includes(e.key)) check();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    window.addEventListener('zaky_store_updated', check);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') check();
    }, intervalMs);

    return () => {
      window.removeEventListener('zaky_store_updated', check);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [intervalMs]);
}
