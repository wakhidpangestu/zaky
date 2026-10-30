'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowRight, Check, Search } from 'lucide-react';
import { JOURNEY_CHAPTERS, chapterProgress, journeyPose } from '@/lib/office/journey';
import type { JourneyApi } from './scene';
// three.js (~580 KB) baru dimuat saat pengunjung berinteraksi. Sampai saat itu
// poster hasil render scene yang sama menempati posisinya (pola facade).
const Scene = dynamic(() => import('./scene'), { ssr: false, loading: () => null });
const INTENT_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

/** true setelah interaksi pertama (atau bila halaman dibuka di posisi tergulir). */
function useLiveScene() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (live) return;
    const go = () => setLive(true);
    if (window.scrollY > 0) {
      go();
      return;
    }
    for (const e of INTENT_EVENTS) window.addEventListener(e, go, { once: true, passive: true });
    return () => {
      for (const e of INTENT_EVENTS) window.removeEventListener(e, go);
    };
  }, [live]);
  return live;
}

const POSTER_MOBILE = '/scenes/journey-hero-mobile.webp';
const POSTER_DESKTOP = '/scenes/journey-hero-desktop.webp';
const POSTER_MEDIA = '(max-width: 760px)';

function ScenePoster({ hidden }: { hidden: boolean }) {
  return (
    <>
      {/* React 19 meng-hoist <link> ke <head>: poster (elemen LCP) diminta paling awal. */}
      <link rel="preload" as="image" href={POSTER_MOBILE} media={POSTER_MEDIA} fetchPriority="high" />
      <link
        rel="preload"
        as="image"
        href={POSTER_DESKTOP}
        media="(min-width: 761px)"
        fetchPriority="high"
      />
      <picture className="zj-poster" data-hidden={hidden || undefined}>
        <source media={POSTER_MEDIA} srcSet={POSTER_MOBILE} type="image/webp" />
        <img
          src={POSTER_DESKTOP}
          alt=""
          fetchPriority="high"
          decoding="sync"
          width={1440}
          height={900}
        />
      </picture>
    </>
  );
}
export default function Journey({
  onStart,
}: {
  onStart: (kind?: 'receipt' | 'distribution') => void;
}) {
  const router = useRouter();
  const track = useRef<HTMLElement>(null),
    scene = useRef<JourneyApi>(null),
    [chapter, setChapter] = useState(0),
    [failed, setFailed] = useState(false),
    [ready, setReady] = useState(false),
    [code, setCode] = useState(''),
    [error, setError] = useState('');
  const live = useLiveScene();
  const seek = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const p = Math.max(
      0,
      Math.min(
        1,
        -node.getBoundingClientRect().top / Math.max(1, node.offsetHeight - window.innerHeight),
      ),
    );
    scene.current?.seek(p);
    setChapter(journeyPose(p).chapter);
  }, []);
  useEffect(() => {
    // Listener scroll pasif + satu frame per perubahan; progres dihitung
    // langsung dari posisi track sehingga tidak butuh pustaka scroll.
    let frame = 0,
      disposed = false;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), seek()));
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    void document.fonts?.ready.then(() => {
      if (!disposed) schedule();
    });
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
    };
  }, [seek]);
  function jump(index: number) {
    const node = track.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + chapterProgress(index) * (node.offsetHeight - window.innerHeight),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
  const c = JOURNEY_CHAPTERS[chapter];
  return (
    <section
      className={'zj-track' + (failed ? ' zj-no-webgl' : '')}
      ref={track}
      data-chapter={chapter}
      aria-label="Perjalanan layanan Zaky"
    >
      <div className="zj-stage">
        <div className="zj-visual">
          {failed ? (
            <div className="zj-scene-fallback">
              <div className="zw-building">
                <span>zaky.</span>
                <i />
                <i />
                <i />
                <i />
              </div>
              <p>Ilustrasi 3D tidak tersedia. Semua langkah tetap dapat dibuka.</p>
            </div>
          ) : (
            <>
              <ScenePoster hidden={ready} />
              {live && (
                <Scene
                  ref={scene}
                  onReady={() => {
                    seek();
                    setReady(true);
                  }}
                  onError={() => setFailed(true)}
                  onStation={(station) =>
                    jump(JOURNEY_CHAPTERS.findIndex((c) => c.station === station))
                  }
                />
              )}
            </>
          )}
        </div>
        <div className="zj-copy" key={chapter}>
          <p className="zj-eyebrow">{c.eyebrow}</p>
          <h1>
            {c.title}
            <span>{c.accent}</span>
          </h1>
          <p className="zj-description">{c.description}</p>
          {chapter === 0 ? (
            <>
              <form
                className="zj-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!/^[A-Z0-9]{12}$/.test(code.trim().toUpperCase())) {
                    setError('Gunakan 12 karakter kode catatan.');
                    return;
                  }
                  router.push('/verifikasi/' + encodeURIComponent(code.trim().toUpperCase()));
                }}
              >
                <Search size={15} />
                <label>
                  <span>KODE CATATAN</span>
                  <input
                    name="kode"
                    autoComplete="off"
                    aria-label="Kode catatan untuk verifikasi"
                    placeholder="Periksa kode Anda"
                    maxLength={12}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setError('');
                    }}
                  />
                </label>
                <button aria-label="Periksa kode">
                  <ArrowRight size={17} />
                </button>
              </form>
              {error && (
                <p className="zj-error" role="alert">
                  {error}
                </p>
              )}
              <div className="zj-facts">
                <div>
                  <strong>5 tahap</strong>
                  <small>Alur kerja terhubung</small>
                </div>
                <div>
                  <strong>2 mode</strong>
                  <small>Catatan yang sama</small>
                </div>
                <div>
                  <strong>8 asnaf</strong>
                  <small>Kriteria penerima</small>
                </div>
              </div>
            </>
          ) : (
            <div className="zj-context-card">
              <small>{c.cardTitle}</small>
              <dl>
                {c.rows.map(([a, b]) => (
                  <div key={a}>
                    <dt>
                      <Check size={11} />
                      {a}
                    </dt>
                    <dd>{b}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() =>
                  chapter === 1
                    ? onStart('receipt')
                    : chapter === 2
                      ? onStart('distribution')
                      : router.push('/dasbor?mode=standard')
                }
              >
                {c.action}
                <ArrowRight size={12} />
              </button>
            </div>
          )}
          {chapter === 0 && (
            <button className="zj-text-link" onClick={() => jump(1)}>
              Ikuti perjalanan amanah <ArrowDown size={13} />
            </button>
          )}
        </div>
        <span className="zj-handnote" aria-hidden="true">
          Satu amanah,
          <br />
          saling menjaga.
        </span>
        <div className="zj-bottom">
          <nav aria-label="Tahap perjalanan">
            {JOURNEY_CHAPTERS.map((s, i) => (
              <button
                aria-current={i === chapter ? 'step' : undefined}
                data-done={i < chapter || undefined}
                key={s.label}
                onClick={() => jump(i)}
              >
                <small>{String(i + 1).padStart(2, '0')}</small>
                {s.label}
              </button>
            ))}
          </nav>
          <button
            className="zj-skip"
            onClick={() =>
              document.getElementById('pelacakan')?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'instant'
                  : 'smooth',
              })
            }
          >
            Lewati <ArrowDown size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}
