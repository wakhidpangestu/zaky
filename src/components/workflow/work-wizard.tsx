'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  HandCoins,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import {
  formatMoney,
  parseOperation,
  type OfficeCatalog,
  type OperationResult,
} from '@/lib/office/operations';
import Receipt from './receipt';
import './workflow.css';
const steps = ['Jenis catatan', 'Pos dana', 'Rincian', 'Periksa & simpan', 'Bukti pencatatan'];
export default function WorkWizard({
  initial = 'receipt',
  onClose,
  onSaved,
}: {
  initial?: 'receipt' | 'distribution';
  onClose: () => void;
  onSaved?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    controller = useRef<AbortController | null>(null),
    pending = useRef<{ key: string; id: string } | null>(null),
    busy = useRef(false),
    alive = useRef(true);
  const [step, setStep] = useState(0),
    [kind, setKind] = useState(initial),
    [catalog, setCatalog] = useState<OfficeCatalog | null>(null),
    [loadError, setLoadError] = useState(''),
    [error, setError] = useState(''),
    [sending, setSending] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState(''),
    [recipientLoading, setRecipientLoading] = useState(false),
    [recipientError, setRecipientError] = useState('');
  const [posId, setPosId] = useState(''),
    [amount, setAmount] = useState(''),
    [percent, setPercent] = useState('0'),
    [channel, setChannel] = useState('Transfer tercatat'),
    [donorType, setDonorType] = useState<'anonim' | 'terdaftar'>('anonim'),
    [donorName, setDonorName] = useState(''),
    [note, setNote] = useState(''),
    [recipient, setRecipient] = useState(''),
    [method, setMethod] = useState<'saksi' | 'mustahik'>('saksi'),
    [file, setFile] = useState<File | null>(null),
    [upload, setUpload] = useState<{ id: string; filename: string } | null>(null),
    [ack, setAck] = useState(false),
    [result, setResult] = useState<OperationResult | null>(null);
  useEffect(() => {
    alive.current = true;
    dialog.current?.showModal();
    const abort = new AbortController();
    void fetch('/api/office/catalog', { cache: 'no-store', signal: abort.signal })
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        setCatalog(b);
        setPosId(b.funds[0]?.id ?? '');
        setRecipient(b.recipients[0]?.id ?? '');
      })
      .catch((e) => {
        if (!abort.signal.aborted)
          setLoadError(e instanceof Error ? e.message : 'Katalog belum tersedia.');
      });
    return () => {
      alive.current = false;
      abort.abort();
      controller.current?.abort();
    };
  }, []);
  const catalogLoaded = !!catalog;
  useEffect(() => {
    if (!catalogLoaded || kind !== 'distribution' || step !== 2) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      setRecipientLoading(true);
      setRecipientError('');
      void fetch('/api/office/catalog?q=' + encodeURIComponent(recipientQuery), {
        cache: 'no-store',
        signal: abort.signal,
      })
        .then(async (r) => {
          const body = await r.json();
          if (!r.ok) throw new Error(body.error);
          if (abort.signal.aborted) return;
          setCatalog((current) =>
            current
              ? {
                  ...current,
                  recipients: body.recipients,
                  recipientsHasMore: body.recipientsHasMore,
                }
              : current,
          );
          setRecipient((current) =>
            body.recipients.some((r: { id: string }) => r.id === current)
              ? current
              : (body.recipients[0]?.id ?? ''),
          );
        })
        .catch((e) => {
          if (!abort.signal.aborted)
            setRecipientError(e instanceof Error ? e.message : 'Pencarian belum tersedia.');
        })
        .finally(() => {
          if (!abort.signal.aborted) setRecipientLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [catalogLoaded, kind, step, recipientQuery]);
  function close() {
    if (sending) return;
    if (step > 1 && !result && !window.confirm('Tutup formulir? Isian belum disimpan.')) return;
    onClose();
  }
  const fund = catalog?.funds.find((f) => f.id === posId),
    beneficiary = catalog?.recipients.find((r) => r.id === recipient);
  async function next(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (step < 3) {
      if (step === 1 && !posId) {
        setError('Pilih pos dana yang tersedia.');
        return;
      }
      setStep((n) => n + 1);
      return;
    }
    if (busy.current || !catalog) return;
    if (catalog.actor.peran !== 'amil') {
      setError('Pencatatan baru hanya dapat dilakukan peran amil.');
      return;
    }
    if (!ack) {
      setError('Periksa dan konfirmasi kebenaran data terlebih dahulu.');
      return;
    }
    busy.current = true;
    setSending(true);
    const abort = new AbortController();
    controller.current = abort;
    try {
      let evidence = upload;
      if (kind === 'distribution' && !evidence) {
        if (!file) throw new Error('Unggah berkas bukti yang valid.');
        const r = await fetch('/api/office/evidence', {
          method: 'POST',
          headers: { 'Content-Type': file.type, 'X-Filename': encodeURIComponent(file.name) },
          body: file,
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(20000)]),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        evidence = b;
        setUpload(b);
      }
      const body =
        kind === 'receipt'
          ? {
              kind,
              posId,
              gross: amount,
              amilPercent: percent,
              channel,
              donorType,
              donorName: donorType === 'terdaftar' ? donorName : '',
              note,
            }
          : { kind, posId, mustahikId: recipient, amount, method, evidenceId: evidence?.id };
      const key = JSON.stringify(body);
      if (pending.current?.key !== key) pending.current = { key, id: crypto.randomUUID() };
      const input = parseOperation({ ...body, requestId: pending.current.id });
      if (!input)
        throw new Error(
          'Periksa nominal, pos dana dan rincian. Gunakan angka desimal dengan maksimal dua angka di belakang titik.',
        );
      const response = await fetch('/api/office/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(20000)]),
      });
      const b = await response.json();
      if (!response.ok) {
        if (response.status < 500) pending.current = null;
        throw new Error(b.error || 'Pencatatan belum berhasil.');
      }
      if (alive.current) {
        setResult(b);
        setStep(4);
        pending.current = null;
        onSaved?.();
      }
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error && !['TimeoutError', 'AbortError', 'TypeError'].includes(e.name)
            ? e.message
            : 'Hasil belum terkonfirmasi. Ulangi penyimpanan untuk memeriksa hasil tanpa menggandakan transaksi.',
        );
    } finally {
      busy.current = false;
      if (alive.current) setSending(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="zw-dialog"
      aria-labelledby="zw-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <aside className="zw-progress">
        <div className="zw-building" aria-hidden="true">
          <span>zaky.</span>
          <i />
          <i />
          <i />
          <i />
        </div>
        <small>RUANG KERJA ZAKY</small>
        <h2 id="zw-title">Catat amanah.</h2>
        <ol>
          {steps.map((s, i) => (
            <li
              key={s}
              aria-current={i === step ? 'step' : undefined}
              className={i <= step ? 'active' : ''}
            >
              <span>{i < step ? <Check size={12} /> : i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <div className="zw-summary">
          <small>CATATAN ANDA</small>
          <strong>{kind === 'receipt' ? 'Penerimaan zakat' : 'Draf penyaluran'}</strong>
          {fund && <p>{fund.nama}</p>}
          {amount && <strong>{formatMoney(amount)}</strong>}
          <small>Data disimpan setelah pemeriksaan server.</small>
        </div>
      </aside>
      <section className="zw-content">
        <button className="zw-close" aria-label="Tutup formulir" disabled={sending} onClick={close}>
          <X size={18} />
        </button>
        <div className="zw-meter" style={{ width: ((step + 1) / 5) * 100 + '%' }} />
        {step === 4 && result ? (
          <>
            <div className="zw-success">
              <Check />
              <h3>Catatan berhasil disimpan.</h3>
              <p>Antrean tugas mengikuti hasil yang tersimpan.</p>
            </div>
            <Receipt result={result} amount={amount} />
            <button className="zw-primary" onClick={onClose}>
              Selesai
            </button>
          </>
        ) : (
          <form onSubmit={next}>
            <div className="zw-step">
              <small>LANGKAH {step + 1} DARI 5</small>
              <h3>{steps[step]}</h3>
              <p>
                {
                  [
                    'Pilih pekerjaan yang ingin Anda catat.',
                    'Pilih sumber dana yang sesuai.',
                    'Isi rincian sesuai transaksi yang sebenarnya.',
                    'Pastikan seluruh isian benar sebelum disimpan.',
                  ][step]
                }
              </p>
            </div>
            {loadError && step > 0 ? (
              <div className="zw-note" role="alert">
                <p>{loadError}</p>
                <Link href="/login" className="zw-primary">
                  Masuk sebagai petugas
                </Link>
                <p>Anda tetap dapat mempelajari alur tanpa membuat transaksi.</p>
              </div>
            ) : (
              <>
                {step === 0 && (
                  <div className="zw-options">
                    {(
                      [
                        {
                          id: 'receipt',
                          title: 'Penerimaan zakat',
                          desc: 'Catat dana masuk dan alokasi hak amil.',
                          Icon: HandCoins,
                        },
                        {
                          id: 'distribution',
                          title: 'Draf penyaluran',
                          desc: 'Cadangkan dana untuk mustahik terdaftar.',
                          Icon: FileCheck2,
                        },
                      ] as const
                    ).map((c) => (
                      <label className={kind === c.id ? 'selected' : ''} key={c.id}>
                        <input
                          type="radio"
                          name="operation-kind"
                          checked={kind === c.id}
                          onChange={() => setKind(c.id)}
                        />
                        <c.Icon />
                        <strong>{c.title}</strong>
                        <span>{c.desc}</span>
                      </label>
                    ))}
                  </div>
                )}
                {step === 1 && (
                  <>
                    {!catalog ? (
                      <p role="status">Memuat pos dana...</p>
                    ) : catalog.funds.length ? (
                      catalog.funds.map((f) => (
                        <label
                          className={'zw-fund ' + (posId === f.id ? 'selected' : '')}
                          key={f.id}
                        >
                          <input
                            type="radio"
                            name="fund"
                            checked={posId === f.id}
                            onChange={() => setPosId(f.id)}
                          />
                          <Wallet size={20} />
                          <strong>{f.nama}</strong>
                          <span>Tersedia {formatMoney(f.available)}</span>
                        </label>
                      ))
                    ) : (
                      <p>Belum ada pos dana dalam lembaga ini.</p>
                    )}
                  </>
                )}
                {step === 2 && (
                  <div className="zw-fields">
                    <label>
                      Nominal {kind === 'receipt' ? 'bruto' : 'penyaluran'} (Rp)
                      <input
                        autoComplete="off"
                        inputMode="decimal"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </label>
                    {kind === 'receipt' ? (
                      <>
                        <label>
                          Muzakki
                          <select
                            value={donorType}
                            onChange={(e) => setDonorType(e.target.value as 'anonim' | 'terdaftar')}
                          >
                            <option value="anonim">Anonim / Hamba Allah</option>
                            <option value="terdaftar">Nama dicatat secara privat</option>
                          </select>
                        </label>
                        {donorType === 'terdaftar' && (
                          <label>
                            Nama muzakki
                            <input
                              required
                              maxLength={160}
                              value={donorName}
                              onChange={(e) => setDonorName(e.target.value)}
                            />
                          </label>
                        )}
                        <label>
                          Keterangan (opsional)
                          <input
                            maxLength={500}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                        </label>
                        <label>
                          Hak amil (%)
                          <input
                            type="number"
                            min="0"
                            max={catalog?.maxAmilPercent ?? '12.5'}
                            step="0.01"
                            required
                            value={percent}
                            onChange={(e) => setPercent(e.target.value)}
                          />
                          <small>
                            Batas lembaga: {catalog?.maxAmilPercent ?? '—'}%. Alokasi dihitung di
                            server dan dibulatkan ke bawah ke sen.
                          </small>
                        </label>
                        <label>
                          Kanal pencatatan
                          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                            <option>Transfer tercatat</option>
                            <option>Tunai</option>
                            <option>Kanal lain yang sudah terkonfirmasi</option>
                          </select>
                        </label>
                        <p className="zw-note">
                          Ini pencatatan penerimaan yang sudah terjadi. Tidak memulai transfer atau
                          memverifikasi pembayaran bank.
                        </p>
                      </>
                    ) : (
                      <>
                        <label>
                          Cari mustahik
                          <input
                            type="search"
                            maxLength={100}
                            value={recipientQuery}
                            placeholder="Nama samaran, kabupaten, atau asnaf"
                            onChange={(e) => {
                              setRecipientQuery(e.target.value);
                              setRecipientLoading(true);
                            }}
                          />
                        </label>
                        {recipientLoading && <small role="status">Mencari mustahik...</small>}
                        {recipientError && (
                          <p role="alert" className="zw-error">
                            {recipientError}
                          </p>
                        )}
                        {catalog?.recipientsHasMore && (
                          <small>
                            Menampilkan 100 hasil. Persempit pencarian untuk menemukan penerima
                            lainnya.
                          </small>
                        )}
                        <label>
                          Mustahik terdaftar
                          <select
                            required
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                          >
                            {catalog?.recipients.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.nama} / {r.destination} / {r.asnaf}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Metode konfirmasi
                          <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value as 'saksi' | 'mustahik')}
                          >
                            <option value="saksi">Dua saksi independen</option>
                            <option value="mustahik">Tautan konfirmasi mustahik</option>
                          </select>
                        </label>
                        <label>
                          Bukti penyaluran (PDF / gambar, maks. 5 MB)
                          <input
                            type="file"
                            required={!upload}
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              setFile(e.target.files?.[0] ?? null);
                              setUpload(null);
                            }}
                          />
                        </label>
                        <small>
                          Asnaf mengikuti data mustahik. Draf belum berarti dana tersalurkan.
                        </small>
                      </>
                    )}
                  </div>
                )}
                {step === 3 && (
                  <>
                    <dl className="zw-review">
                      <dt>Jenis</dt>
                      <dd>{kind === 'receipt' ? 'Penerimaan' : 'Draf penyaluran'}</dd>
                      <dt>Pos dana</dt>
                      <dd>{fund?.nama}</dd>
                      <dt>Nominal</dt>
                      <dd>{formatMoney(amount)}</dd>
                      {kind === 'receipt' ? (
                        <>
                          <dt>Hak amil</dt>
                          <dd>{percent}%</dd>
                          <dt>Kanal</dt>
                          <dd>{channel}</dd>
                        </>
                      ) : (
                        <>
                          <dt>Mustahik</dt>
                          <dd>
                            {beneficiary?.nama} / {beneficiary?.asnaf}
                          </dd>
                          <dt>Konfirmasi</dt>
                          <dd>{method === 'saksi' ? 'Dua saksi independen' : 'Mustahik'}</dd>
                          <dt>Bukti</dt>
                          <dd>{upload?.filename ?? file?.name ?? 'Belum dipilih'}</dd>
                        </>
                      )}
                    </dl>
                    <label className="zw-ack">
                      <input
                        type="checkbox"
                        required
                        checked={ack}
                        onChange={(e) => setAck(e.target.checked)}
                      />
                      <span>Saya sudah memeriksa kebenaran data dan bukti yang saya catat.</span>
                    </label>
                    <p className="zw-note">
                      <ShieldCheck size={16} /> Validasi peran, saldo, dan aturan lembaga dilakukan
                      sebelum transaksi disimpan.
                    </p>
                  </>
                )}
              </>
            )}
            {error && (
              <p className="zw-error" role="alert">
                {error}
              </p>
            )}
            <footer>
              <button
                type="button"
                disabled={!step || sending}
                onClick={() => {
                  setStep((n) => n - 1);
                  setAck(false);
                  setError('');
                }}
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <button
                className="zw-primary"
                disabled={
                  sending ||
                  (step === 2 &&
                    kind === 'distribution' &&
                    (recipientLoading || !!recipientError)) ||
                  (step > 0 && (!catalog || !!loadError))
                }
              >
                {sending ? 'Menyimpan...' : step === 3 ? 'Simpan catatan' : 'Lanjut'}
                {!sending && <ArrowRight size={14} />}
              </button>
            </footer>
          </form>
        )}
      </section>
    </dialog>
  );
}
