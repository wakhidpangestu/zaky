'use client';
import { useState } from 'react';
import { LoaderCircle, Play } from 'lucide-react';

export interface ParamSpec {
  name: string;
  in: 'path' | 'query';
  required: boolean;
  description?: string;
  example?: string;
}

/** Tanggal WIB kemarin: hari terakhir yang sudah tutup buku. */
function kemarinWib() {
  const hariIni = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  return new Date(Date.parse(hariIni) - 86_400_000).toISOString().slice(0, 10);
}

/** Memanggil endpoint GET langsung dari browser, persis seperti aplikasi pihak ketiga. */
// Tanggal di path boleh dikosongkan: diisi kemarin (WIB) saat dikirim, bukan saat render,
// karena halaman ini di-prerender dan waktu saat build tidak boleh membeku di HTML.
const tanggalOtomatis = (p: ParamSpec) => p.in === 'path' && p.name === 'tanggal';

export default function TryIt({ path, params }: { path: string; params: ParamSpec[] }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((p) => [p.name, p.example ?? ''])),
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ status: number; ms: number; body: string } | null>(null);

  function buildUrl(isiKosong: (p: ParamSpec) => string) {
    let u = path;
    const qs = new URLSearchParams();
    for (const p of params) {
      const v = values[p.name]?.trim() || isiKosong(p);
      if (p.in === 'path') u = u.replace(`{${p.name}}`, v.startsWith('{') ? v : encodeURIComponent(v));
      else if (v) qs.set(p.name, v);
    }
    const s = qs.toString();
    return s ? `${u}?${s}` : u;
  }
  const url = buildUrl((p) => (tanggalOtomatis(p) ? '{kemarin}' : p.in === 'path' ? `{${p.name}}` : ''));
  const missing = params.some((p) => p.required && !tanggalOtomatis(p) && !values[p.name]?.trim());

  async function send() {
    setBusy(true);
    const t0 = performance.now();
    try {
      const r = await fetch(buildUrl((p) => (tanggalOtomatis(p) ? kemarinWib() : '')), { cache: 'no-store' });
      const text = await r.text();
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* bukan JSON */
      }
      setResult({ status: r.status, ms: Math.round(performance.now() - t0), body: body.length > 6000 ? body.slice(0, 6000) + '\n…(dipotong)' : body });
    } catch (e) {
      setResult({ status: 0, ms: 0, body: e instanceof Error ? e.message : 'Permintaan gagal.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="zd-try">
      {params.length > 0 && (
        <div className="zd-try-fields">
          {params.map((p) => (
            <label key={p.name}>
              <span>
                {p.name}
                {p.required && <b aria-label="wajib">*</b>} <small>{p.in}</small>
              </span>
              <input
                value={values[p.name] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                placeholder={tanggalOtomatis(p) ? 'Kosongkan = kemarin (WIB)' : p.description}
                spellCheck={false}
                autoComplete="off"
              />
            </label>
          ))}
        </div>
      )}
      <div className="zd-try-bar">
        <code className="zd-try-url">GET {url}</code>
        <button type="button" className="zs-btn zs-btn-green zs-btn-sm" onClick={send} disabled={busy || missing}>
          {busy ? <LoaderCircle size={15} className="zd-spin" aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
          Coba
        </button>
      </div>
      <div aria-live="polite">
        {result && (
          <div className="zd-try-result">
            <p>
              <b className={result.status >= 200 && result.status < 300 ? 'ok' : 'bad'}>HTTP {result.status || 'gagal'}</b>
              {result.ms > 0 && <span> · {result.ms} ms</span>}
            </p>
            <pre tabIndex={0}>{result.body}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
