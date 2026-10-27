'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight, Check, Search } from 'lucide-react';
import { JOURNEY_CHAPTERS, chapterProgress, journeyPose } from '@/lib/office/journey';
import type { JourneyApi } from './scene';
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => (
    <div className="zj-loading" role="status">
      Menyiapkan ruang layanan...
    </div>
  ),
});
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
    [code, setCode] = useState(''),
    [error, setError] = useState('');
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
    if (!scene.current || failed) setChapter(journeyPose(p).chapter);
  }, [failed]);
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    gsap.registerPlugin(ScrollTrigger);
    let disposed = false;
    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: node,
        start: 'top top',
        end: () => '+=' + Math.max(1, node.offsetHeight - window.innerHeight),
        invalidateOnRefresh: true,
        onUpdate: seek,
        onRefresh: seek,
      });
      void document.fonts.ready.then(() => {
        if (!disposed) trigger.refresh();
      });
    }, node);
    const restore = () => seek();
    window.addEventListener('pageshow', restore);
    return () => {
      disposed = true;
      context.revert();
      window.removeEventListener('pageshow', restore);
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
            <Scene
              ref={scene}
              onReady={seek}
              onChapter={setChapter}
              onError={() => setFailed(true)}
              onStation={(station) =>
                jump(JOURNEY_CHAPTERS.findIndex((c) => c.station === station))
              }
            />
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
                      : router.push('/dasbor?mode=3d')
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
