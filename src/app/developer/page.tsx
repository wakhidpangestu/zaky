import type { Metadata } from 'next';
import { Braces, Download, KeyRound, Network } from 'lucide-react';
import SitePage from '@/components/site/site-page';
import spec from '../../../public/openapi.json';
import TryIt, { type ParamSpec } from './try-it';
import './developer.css';

export const metadata: Metadata = {
  title: 'API Publik',
  description:
    'Dokumentasi OpenAPI 3.1 untuk API publik dan antarlembaga Zaky: verifikasi catatan, paket bukti, hash harian bertanda tangan, dan kesaksian Ed25519.',
};

type RawParam = { $ref?: string; name?: string; in?: string; required?: boolean; description?: string; example?: string };
type Operation = {
  tags?: string[];
  summary: string;
  description?: string;
  operationId: string;
  parameters?: RawParam[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
};

const LEMBAGA_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function resolveParam(p: RawParam): ParamSpec {
  const raw = p.$ref
    ? (spec.components.parameters as Record<string, RawParam>)[p.$ref.split('/').pop()!]
    : p;
  return {
    name: raw.name!,
    in: raw.in as ParamSpec['in'],
    required: !!raw.required,
    description: raw.description?.replace(/`/g, ''),
    example: raw.example ?? (raw.name === 'lembaga' ? LEMBAGA_A : undefined),
  };
}

const operations = Object.entries(spec.paths as Record<string, Record<string, Operation>>).flatMap(([path, methods]) =>
  Object.entries(methods).map(([method, op]) => ({ path, method: method.toUpperCase(), op })),
);

/** Teks deskripsi memakai `kode` gaya Markdown; tampilkan sebagai <code>. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part,
      )}
    </>
  );
}

const CONTOH_KESAKSIAN = `node scripts/kirim-kesaksian.ts --saksi=B --target=http://localhost:3000`;

export default function DeveloperPage() {
  return (
    <SitePage>
      <div className="zd">
        <header className="zd-hero">
          <span className="zs-eyebrow">
            <Braces size={14} aria-hidden="true" /> API publik · OpenAPI {spec.openapi}
          </span>
          <h1 className="zs-title">
            Zaky dapat dipanggil sistem lain. <em>Tanpa perlu mempercayai kami.</em>
          </h1>
          <p className="zs-lead">
            <Rich text={spec.info.description} />
          </p>
          <div className="zd-links">
            <a className="zs-btn zs-btn-green zs-btn-sm" href="/openapi.json" download="zaky-openapi.json">
              <Download size={15} aria-hidden="true" /> Unduh openapi.json
            </a>
            <a className="zs-btn zs-btn-ghost zs-btn-sm" href="/api/publik/direktori">
              <KeyRound size={15} aria-hidden="true" /> Kunci publik anggota
            </a>
            <a className="zs-btn zs-btn-ghost zs-btn-sm" href="/silang">
              <Network size={15} aria-hidden="true" /> Papan silang
            </a>
          </div>
        </header>

        <section className="zd-flow" aria-labelledby="zd-flow-title">
          <h2 id="zd-flow-title">Alur antarlembaga</h2>
          <ol>
            <li>
              <b>Lembaga A menerbitkan</b> kepala rantai audit setiap akhir hari WIB, ditandatangani Ed25519:{' '}
              <code>GET /api/publik/hash-harian/&#123;lembaga&#125;/&#123;tanggal&#125;</code>
            </li>
            <li>
              <b>Lembaga B dan C memverifikasi</b> tanda tangan itu dengan kunci dari{' '}
              <code>GET /api/publik/direktori</code>, lalu menandatangani kesaksian.
            </li>
            <li>
              <b>Kesaksian dikirim</b> ke <code>POST /api/jaringan/kesaksian</code>. Hash yang berbeda tetap dicatat
              sebagai bukti ketidaksesuaian.
            </li>
            <li>
              <b>Siapa pun memeriksa</b> satu catatan lewat <code>GET /api/publik/bukti/&#123;kode&#125;</code> dan
              menghitung ulang semuanya sendiri.
            </li>
          </ol>
          <p>
            Klien contoh yang berperan sebagai Lembaga B: <code>{CONTOH_KESAKSIAN}</code>
          </p>
        </section>

        {operations.map(({ path, method, op }) => {
          const params = (op.parameters ?? []).map(resolveParam);
          return (
            <section key={op.operationId} className="zd-op" id={op.operationId} aria-labelledby={op.operationId + '-t'}>
              <header>
                <span className={'zd-method zd-' + method.toLowerCase()}>{method}</span>
                <code className="zd-path">{path}</code>
                {op.tags?.map((t) => (
                  <span key={t} className="zd-tag">
                    {t}
                  </span>
                ))}
              </header>
              <h2 id={op.operationId + '-t'}>{op.summary}</h2>
              {op.description && (
                <p>
                  <Rich text={op.description} />
                </p>
              )}
              {params.length > 0 && (
                <table className="zd-params">
                  <caption className="sr-only">Parameter {path}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Parameter</th>
                      <th scope="col">Letak</th>
                      <th scope="col">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map((p) => (
                      <tr key={p.name}>
                        <td>
                          <code>{p.name}</code>
                          {p.required ? ' (wajib)' : ''}
                        </td>
                        <td>{p.in}</td>
                        <td>{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="zd-codes">
                Respons:{' '}
                {Object.keys(op.responses).map((c) => (
                  <code key={c} className={c.startsWith('2') ? 'ok' : ''}>
                    {c}
                  </code>
                ))}
              </p>
              {method === 'GET' ? (
                <TryIt path={path} params={params} />
              ) : (
                <pre className="zd-sample" tabIndex={0}>
                  {`curl -X POST ${spec.servers[0].url}${path} \\
  -H 'Content-Type: application/json' \\
  -d '{"saksi_lembaga_id":"bbbbbbbb-…","lembaga_id":"aaaaaaaa-…","tanggal":"YYYY-MM-DD",
       "hash_disaksikan":"<64 hex>","diamati_pada":"<ISO waktu sekarang>","tanda_tangan_saksi":"<128 hex>"}'

# Tanda tangan dibuat atas JCS lima field pertama; gunakan klien contoh:
${CONTOH_KESAKSIAN}`}
                </pre>
              )}
            </section>
          );
        })}
      </div>
    </SitePage>
  );
}
