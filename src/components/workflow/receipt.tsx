'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatMoney, buildCalendar, type OperationResult } from '@/lib/office/operations';
export default function Receipt({ result, amount }: { result: OperationResult; amount?: string }) {
  const [qr, setQr] = useState(''),
    [error, setError] = useState('');
  const href = '/pekerjaan?item=' + encodeURIComponent(result.workItemId);
  // The QR is for anyone holding the paper, so it opens the public verification page.
  const publicPath = '/verifikasi/' + encodeURIComponent(result.code);
  useEffect(() => {
    let disposed = false;
    void import('qrcode')
      .then((m) =>
        m.default.toDataURL(window.location.origin + publicPath, {
          margin: 1,
          width: 180,
          errorCorrectionLevel: 'M',
        }),
      )
      .then((url) => {
        if (!disposed) setQr(url);
      })
      .catch(() => {
        if (!disposed) setError('QR belum tersedia. Tautan catatan tetap dapat dibuka.');
      });
    return () => {
      disposed = true;
    };
  }, [publicPath]);
  function calendar() {
    if (!result.expiresAt) return;
    const content = buildCalendar({
      code: result.code,
      title: 'Tindak lanjut ' + result.code,
      deadline: result.expiresAt,
      url: window.location.origin + href,
    });
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Tindak-lanjut-' + result.code + '.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div>
      <div className="zw-receipt">
        <header>
          <strong>
            zaky<span>.</span>
          </strong>
          <small>BUKTI PENCATATAN</small>
        </header>
        <div className="zw-receipt-body">
          <div>
            <p>Kode catatan</p>
            <h3>{result.code}</h3>
            <p>{result.type === 'penerimaan' ? 'Penerimaan tercatat' : 'Catatan penyaluran'}</p>
            <strong>{amount ? formatMoney(amount) : ''}</strong>
            <p>Status: {result.status}</p>
            {result.createdAt && (
              <time dateTime={result.createdAt}>
                {new Date(result.createdAt).toLocaleString('id-ID')}
              </time>
            )}
            <small>
              Bukti ini menunjukkan pencatatan. Bukan bukti pembayaran bank atau penyaluran selesai.
            </small>
          </div>
          {qr && (
            <Image
              src={qr}
              width={140}
              height={140}
              alt={'QR verifikasi publik ' + result.code}
              unoptimized
            />
          )}
        </div>
      </div>
      {error && <p role="status">{error}</p>}
      <div className="zw-actions">
        <a href={'/cetak/' + encodeURIComponent(result.code) + '?auto=1'} target="_blank" rel="noopener">
          Cetak / simpan PDF
        </a>
        {result.expiresAt && (
          <button type="button" onClick={calendar}>
            Tambahkan tenggat ke kalender
          </button>
        )}
        <Link href={href}>Buka catatan <ArrowRight size={14} className="inline" aria-hidden="true" /></Link>
      </div>
      {result.confirmationUrl && (
        <div className="zw-note">
          <strong>Tautan konfirmasi mustahik</strong>
          <p>
            Kirim hanya kepada penerima yang benar. Tautan ini mengizinkan konfirmasi satu
            keputusan.
          </p>
          <input
            readOnly
            value={
              typeof window !== 'undefined'
                ? window.location.origin + result.confirmationUrl
                : result.confirmationUrl
            }
            aria-label="Tautan konfirmasi mustahik"
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
    </div>
  );
}
