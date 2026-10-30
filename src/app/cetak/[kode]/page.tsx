import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { muatDokumen, terbilang, type DokumenCetak } from '@/lib/cetak';
import ZakyLogo from '@/components/zaky-logo';
import { STATUS_LABELS } from '@/lib/office/model';
import PrintButton from './print-button';
import './cetak.css';

export const instant = false;
export const metadata = { title: 'Cetak bukti catatan', robots: { index: false, follow: false } };

const AKSI: Record<string, string> = {
  TAMBAH_PENERIMAAN: 'Penerimaan dicatat',
  BUAT_DRAF_RESERVASI: 'Draf dibuat, dana dicadangkan',
  KONFIRMASI_SAKSI_TERIMA: 'Saksi mengonfirmasi penyerahan',
  KONFIRMASI_SAKSI_TOLAK: 'Saksi menolak penyerahan',
  KONFIRMASI_MUSTAHIK_TERIMA: 'Mustahik mengonfirmasi',
  KONFIRMASI_MUSTAHIK_TOLAK: 'Mustahik menolak',
  SETUJUI_PENYALURAN: 'Penyaluran disahkan',
  BATALKAN_DRAF: 'Draf dibatalkan',
  KEDALUWARSA_MUSTAHIK: 'Tautan mustahik kedaluwarsa',
};
const ASNAF: Record<string, string> = {
  fakir: 'Fakir',
  miskin: 'Miskin',
  amil: 'Amil',
  muallaf: 'Mualaf',
  riqab: 'Riqab',
  gharimin: 'Gharimin',
  fisabilillah: 'Fisabilillah',
  ibnu_sabil: 'Ibnu sabil',
};
const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const wib = (iso: string, withTime = true) =>
  new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Jakarta',
  }) + (withTime ? ' WIB' : '');
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Public address of this deployment, for the QR. APP_URL wins over request headers. */
async function origin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  return (h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')) + '://' + host;
}

async function Dokumen({ params, search }: { params: Promise<{ kode: string }>; search: Promise<{ auto?: string }> }) {
  const [{ kode }, { auto }] = await Promise.all([params, search]);
  const doc = await muatDokumen(kode);
  if (!doc) notFound();
  const url = `${await origin()}/verifikasi/${doc.kode}`;
  const qr = await QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0b1f17', light: '#ffffff' },
  });
  const final = doc.status === 'recorded' || doc.status === 'tersalurkan';
  return (
    <>
      <nav className="zc-toolbar" aria-label="Aksi dokumen">
        <Link href={`/verifikasi/${doc.kode}`} className="zc-btn">
          <ArrowLeft size={18} aria-hidden="true" /> Kembali
        </Link>
        <p>
          Di jendela cetak, pilih <b>Simpan sebagai PDF</b> untuk mengunduh berkasnya.
        </p>
        <PrintButton auto={auto === '1'} />
      </nav>
      <Sheet doc={doc} qr={qr} url={url} final={final} />
    </>
  );
}

function Sheet({ doc, qr, url, final }: { doc: DokumenCetak; qr: string; url: string; final: boolean }) {
  const masuk = doc.tipe === 'penerimaan';
  const rows: [string, string][] = masuk
    ? [
        ['Pos dana', doc.pos],
        ['Diterima (bruto)', rupiah(doc.nominal)],
        ['Hak amil', rupiah(doc.hakAmil ?? 0)],
        ['Masuk pos dana', rupiah(doc.masukPos ?? doc.nominal)],
        ['Kanal', sentence(doc.kanal ?? '-')],
        ['Muzakki', doc.muzakki === 'anonim' ? 'Hamba Allah (anonim)' : 'Terdaftar'],
        ['Dicatat', wib(doc.dibuatPada)],
      ]
    : [
        ['Pos dana', doc.pos],
        ['Asnaf', ASNAF[doc.asnaf ?? ''] ?? doc.asnaf ?? '-'],
        ['Wilayah mustahik', doc.wilayah ?? '-'],
        ['Metode konfirmasi', doc.metode === 'mustahik' ? 'Konfirmasi mustahik' : 'Dua saksi lintas unit'],
        ['Status', STATUS_LABELS[doc.status] ?? doc.status],
        ['Draf dibuat', wib(doc.dibuatPada)],
        ['Disahkan', doc.disetujuiPada ? wib(doc.disetujuiPada) : 'Belum'],
      ];
  return (
    <article className="zc-sheet" aria-label={`Bukti ${doc.kode}`}>
      <header className="zc-head">
        <div className="zc-brand">
          <span className="zc-mark" aria-hidden="true">
            <ZakyLogo size={23} />
          </span>
          <div>
            <strong>{doc.lembaga}</strong>
            <small>
              <b className="zc-wordmark">
                Zaky<span>.</span>
              </b>{' '}
              · buku besar berantai hash, disaksikan antarlembaga
            </small>
          </div>
        </div>
        <div className="zc-doc-id">
          <small>{masuk ? 'BUKTI PENERIMAAN' : 'BUKTI PENYALURAN'}</small>
          <b>{doc.kode}</b>
        </div>
      </header>

      <section className="zc-hero">
        <div>
          <p className="zc-eyebrow">{masuk ? 'Zakat, infak, atau sedekah diterima' : 'Dana zakat disalurkan'}</p>
          <p className="zc-amount">{rupiah(doc.nominal)}</p>
          <p className="zc-words">{sentence(terbilang(doc.nominal))} rupiah</p>
          <p className={'zc-state' + (final ? ' is-final' : '')}>
            <ShieldCheck size={15} aria-hidden="true" />
            {masuk ? 'Tercatat di buku lembaga' : (STATUS_LABELS[doc.status] ?? doc.status)}
          </p>
        </div>
        <figure className="zc-qr">
          <div dangerouslySetInnerHTML={{ __html: qr }} />
          <figcaption>
            Pindai untuk memeriksa keaslian
            <span>{url.replace(/^https?:\/\//, '')}</span>
          </figcaption>
        </figure>
      </section>

      <section className="zc-grid">
        <div>
          <h2>Rincian</h2>
          <dl className="zc-rows">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2>Kesaksian</h2>
          {!masuk && (
            <ul className="zc-list">
              {doc.saksi.length ? (
                doc.saksi.map((s, i) => (
                  <li key={i}>
                    <b>{s.unit}</b>
                    <span>
                      {s.hasil === 'menerima' ? 'Menyaksikan penyerahan' : 'Menolak'} · {wib(s.waktu)}
                    </span>
                  </li>
                ))
              ) : (
                <li>
                  <span>Belum ada kesaksian.</span>
                </li>
              )}
            </ul>
          )}
          <p className="zc-network">
            {doc.jaringan
              ? `Termasuk dalam hash harian ${wib(doc.jaringan.tanggal + 'T12:00:00+07:00', false)} yang disaksikan ${doc.jaringan.saksi} lembaga anggota (Ed25519).`
              : 'Akan masuk hash harian setelah tutup buku pukul 00.00 WIB, lalu disaksikan Lembaga B dan C.'}
          </p>
        </div>
      </section>

      <section>
        <h2>Jejak audit</h2>
        <table className="zc-audit">
          <thead>
            <tr>
              <th>No.</th>
              <th>Peristiwa</th>
              <th>Waktu</th>
              <th>Hash SHA-256</th>
            </tr>
          </thead>
          <tbody>
            {doc.audit.map((a) => (
              <tr key={a.nomor}>
                <td>#{a.nomor}</td>
                <td>{AKSI[a.aksi] ?? a.aksi}</td>
                <td>{wib(a.waktu)}</td>
                <td>
                  <code>
                    {a.hash.slice(0, 16)}…{a.hash.slice(-8)}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {final && (
        <svg className="zc-stamp" viewBox="0 0 160 160" aria-hidden="true">
          <circle cx="80" cy="80" r="74" />
          <circle cx="80" cy="80" r="62" />
          <text x="80" y="72">
            {masuk ? 'TERCATAT' : 'TERSALURKAN'}
          </text>
          <text x="80" y="96" className="small">
            ZAKY · {doc.kode.slice(0, 2)}
          </text>
        </svg>
      )}

      <footer className="zc-foot">
        <p>
          Dokumen ini dibuat otomatis dari buku lembaga, tanpa tanda tangan basah. Keasliannya diperiksa
          dengan memindai QR atau memasukkan kode di halaman verifikasi. Data pribadi muzakki dan mustahik
          tidak dicetak.
        </p>
        <small>Dicetak {wib(new Date().toISOString())}</small>
      </footer>
    </article>
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ kode: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  return (
    <main className="zc-page">
      <Suspense fallback={<p className="zc-loading">Menyiapkan dokumen...</p>}>
        <Dokumen params={params} search={searchParams} />
      </Suspense>
    </main>
  );
}
