'use client';
import { useEffect } from 'react';
import { Printer } from 'lucide-react';

/** Opens the browser print dialog; "Simpan sebagai PDF" there produces the PDF file. */
export default function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    // Let fonts and the QR finish painting before the dialog snapshots the page.
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [auto]);
  return (
    <button type="button" className="zc-btn zc-btn-primary" onClick={() => window.print()}>
      <Printer size={18} aria-hidden="true" /> Cetak / Simpan PDF
    </button>
  );
}
