'use client';
import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  HandCoins,
  HeartHandshake,
  BadgeCheck,
  Network,
  SearchCheck,
  ClipboardList,
  BookOpen,
  UserRound,
} from 'lucide-react';
import {
  BentoTheme,
  CategoriesPanel,
  RevenuePanel,
  SeasonalityPanel,
  SessionsPanel,
} from '@/components/ui/analytics-bento';
import { STATIONS } from '@/lib/office/model';
import {
  DASHBOARD_CARDS,
  ROLE_LABEL,
  STATION_ORDER,
  STATION_ROLE,
  myQueue,
  normalizeLayout,
  type CardId,
  type DashboardLayout,
  type SimView,
} from '@/lib/office/simulator';
import { bento } from './dashboard-data';
import { useSim } from './sim-provider';
import { rupiah, when } from './sim-panels';

const FONTS = {
  currency: 'Rp ',
  fontFamily: 'var(--zaky-font-sans), system-ui, sans-serif',
  monoFamily: 'var(--zaky-font-mono), ui-monospace, monospace',
};
const CARD = 'h-full min-w-0 rounded-[28px] border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6';
/** Width of each card on large screens; everything is full width on phones. */
const SPAN: Record<CardId, string> = {
  saldo: 'lg:col-span-12',
  'dana-masuk': 'lg:col-span-5',
  aktivitas: 'lg:col-span-7',
  tugas: 'lg:col-span-4',
  transaksi: 'lg:col-span-8',
  asnaf: 'lg:col-span-7',
  ritme: 'lg:col-span-5',
  audit: 'lg:col-span-7',
  tim: 'lg:col-span-5',
  akses: 'lg:col-span-12',
};
const TITLE: Record<CardId, string> = {
  saldo: 'Saldo pos dana',
  'dana-masuk': 'Dana masuk',
  aktivitas: 'Aktivitas per jam',
  tugas: 'Tugas saya',
  transaksi: 'Transaksi & hash',
  asnaf: 'Penyaluran per asnaf',
  ritme: 'Ritme mingguan',
  audit: 'Jejak audit',
  tim: 'Kinerja tim',
  akses: 'Akses cepat',
};

function Heading({ title, note }: { title: string; note?: string }) {
  return (
    <>
      <h3 className="pr-10 text-[17px] font-semibold tracking-[-0.02em]">{title}</h3>
      {note && <p className="mb-3 text-[13px] text-muted-foreground">{note}</p>}
    </>
  );
}

function Balances({ view }: { view: SimView }) {
  const tiles = [
    ['Pos zakat', view.funds.zakat, 'Siap disalurkan'],
    ['Pos infak', view.funds.infak, 'Infak & sedekah'],
    ['Hak amil', view.funds.amil, 'Terpisah dari pos'],
    ['Dicadangkan', view.funds.reserved, 'Draf menunggu proses'],
    ['Tersalurkan', view.funds.distributed, 'Catatan terbit'],
  ] as const;
  return (
    <section className={CARD} aria-label="Saldo pos dana">
      <Heading title="Saldo pos dana" note="Bergerak langsung setiap ada penerimaan, draf, atau persetujuan." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map(([label, value, note]) => (
          <div key={label} className="rounded-[18px] border border-border bg-muted/40 p-4">
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <p className="mt-1.5 font-mono text-xl font-medium tracking-[-0.04em] tabular-nums">{rupiah(value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Tasks({ view, onSimulator }: { view: SimView; onSimulator?: () => void }) {
  const mine = STATION_ORDER.filter((s) => STATION_ROLE[s] === view.me.role);
  return (
    <section className={CARD} aria-label="Tugas saya">
      <Heading title="Tugas saya" note={`Sebagai ${ROLE_LABEL[view.me.role].toLowerCase()}.`} />
      {mine.length ? (
        <ul className="grid gap-2">
          {mine.map((s) => {
            const n = myQueue(view, s);
            return (
              <li key={s} className="flex items-center justify-between gap-3 rounded-[16px] border border-border p-3">
                <span className="grid">
                  <strong className="text-sm">{STATIONS.find((x) => x.id === s)!.title}</strong>
                  <small className="text-xs text-muted-foreground">{n ? `${n} menunggu` : 'Tidak ada antrean'}</small>
                </span>
                <span className={`grid h-8 min-w-8 place-items-center rounded-full px-2 text-sm font-bold ${n ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {n}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Peran pengamat hanya membaca laporan.</p>
      )}
      {onSimulator && mine.length > 0 && (
        <button className="zo-btn mt-4 w-full" onClick={onSimulator}>
          Kerjakan di simulator <ArrowRight size={16} />
        </button>
      )}
    </section>
  );
}

function Transactions({ view, fresh }: { view: SimView; fresh: Set<string> }) {
  return (
    <section className={CARD} aria-label="Transaksi dan hash terbaru">
      <Heading title="Transaksi & hash terbaru" note="Setiap transaksi tercatat bersama hash audit-nya." />
      <ul className="grid gap-2">
        {view.transactions.slice(0, 7).map((t) => (
          <li key={t.ref} className={`flex items-center gap-3 rounded-[16px] border border-border p-3 ${fresh.has(t.ref) ? 'zo-new' : ''}`}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${t.kind === 'masuk' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {t.kind === 'masuk' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
            </span>
            <span className="grid min-w-0 flex-1">
              <strong className="truncate text-sm">
                {t.kind === 'masuk' ? `Masuk pos ${t.fund}` : 'Tersalurkan'} · {t.name}
              </strong>
              <small className="truncate text-xs text-muted-foreground">
                {when(t.at)} · <code className="font-mono">{t.hash.slice(0, 16)}…</code>
              </small>
            </span>
            <b className="whitespace-nowrap text-sm tabular-nums">{rupiah(t.amount)}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Audit({ view }: { view: SimView }) {
  return (
    <section className={CARD} aria-label="Jejak audit">
      <Heading title="Jejak audit" note={`${view.auditTotal} entri · setiap entri memuat hash entri sebelumnya.`} />
      <ol className="grid gap-2.5 border-l-2 border-border pl-3">
        {view.audit.slice(0, 7).map((a) => (
          <li key={a.seq} className="grid gap-0.5 text-sm">
            <span>{a.detail}</span>
            <small className="text-xs text-muted-foreground">
              #{a.seq} · {a.actor} · {when(a.at)} · <code className="font-mono">{a.hash.slice(0, 10)}</code>
            </small>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Team({ view }: { view: SimView }) {
  const people = [...view.scores].sort((a, b) => b.correct + b.wrong - (a.correct + a.wrong));
  return (
    <section className={CARD} aria-label="Kinerja tim">
      <Heading title="Kinerja tim" note="Keputusan tepat dibanding total keputusan di simulator." />
      {people.length ? (
        <ul className="grid gap-3">
          {people.map((p) => {
            const total = p.correct + p.wrong,
              rate = total ? Math.round((p.correct / total) * 100) : 0;
            return (
              <li key={p.nama} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span>
                    <strong>{p.nama}</strong> <small className="text-xs text-muted-foreground">{ROLE_LABEL[p.role]}</small>
                  </span>
                  <span className="font-mono text-xs tabular-nums">
                    {rate}% · {total} keputusan
                  </span>
                </div>
                <span className="block h-2 overflow-hidden rounded-full bg-muted">
                  <i className="block h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada keputusan di simulator.</p>
      )}
    </section>
  );
}

const LINKS = [
  { href: '/penerimaan', label: 'Penerimaan', note: 'Catatan zakat masuk', Icon: HandCoins },
  { href: '/penyaluran', label: 'Penyaluran', note: 'Draf & konfirmasi', Icon: HeartHandshake },
  { href: '/persetujuan', label: 'Persetujuan', note: 'Untuk penyetuju', Icon: BadgeCheck },
  { href: '/pekerjaan', label: 'Antrean kerja', note: 'Tugas lembaga', Icon: ClipboardList },
  { href: '/silang', label: 'Papan silang', note: 'Antarlembaga', Icon: Network },
  { href: '/verifikasi', label: 'Verifikasi', note: 'Cek kode & hash', Icon: SearchCheck },
  { href: '/docs', label: 'Dokumentasi', note: 'Cara kerja Zaky', Icon: BookOpen },
  { href: '/profil', label: 'Profil', note: 'Akun & unit', Icon: UserRound },
];
function Shortcuts({ onSimulator }: { onSimulator?: () => void }) {
  return (
    <section className={CARD} aria-label="Akses cepat">
      <Heading title="Akses cepat" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {onSimulator && (
          <button onClick={onSimulator} className="flex items-center gap-3 rounded-[18px] border border-primary/40 bg-accent p-3 text-left">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Boxes size={16} />
            </span>
            <span className="grid">
              <strong className="text-sm">Zaky Simulator</strong>
              <small className="text-xs text-muted-foreground">Kantor 3D bersama</small>
            </span>
          </button>
        )}
        {LINKS.map(({ href, label, note, Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-[18px] border border-border p-3 hover:bg-muted/50">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-accent-foreground">
              <Icon size={16} />
            </span>
            <span className="grid">
              <strong className="text-sm">{label}</strong>
              <small className="text-xs text-muted-foreground">{note}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A dashboard card that can be dragged by its handle (pointer, touch or keyboard). */
function Sortable({ id, editing, onHide, children }: { id: CardId; editing: boolean; onHide: () => void; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative col-span-12 ${SPAN[id]} ${isDragging ? 'z-20 opacity-90 [&>section]:shadow-xl [&>section]:ring-2 [&>section]:ring-primary' : ''} ${editing ? '[&>section]:outline-2 [&>section]:outline-dashed [&>section]:outline-border' : ''}`}
    >
      <div className="absolute right-4 top-4 z-10 flex gap-1.5">
        {editing && (
          <button
            onClick={onHide}
            className="grid size-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
            aria-label={`Sembunyikan ${TITLE[id]}`}
          >
            <EyeOff size={15} />
          </button>
        )}
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className={`grid size-8 cursor-grab touch-none place-items-center rounded-full border border-border bg-card text-muted-foreground transition-opacity hover:text-foreground active:cursor-grabbing ${editing ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 focus-visible:opacity-100'}`}
          aria-label={`Pindahkan ${TITLE[id]}`}
          aria-roledescription="kartu yang bisa dipindah"
        >
          <GripVertical size={15} />
        </button>
      </div>
      {children}
    </div>
  );
}

export default function DashboardBoard({ onSimulator }: { onSimulator?: () => void }) {
  const { view, error, live, act } = useSim();
  const [editing, setEditing] = useState(false),
    [local, setLocal] = useState<DashboardLayout | null>(null),
    [saveError, setSaveError] = useState(''),
    [seen, setSeen] = useState<{ refs: Set<string>; fresh: Set<string> } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const data = useMemo(() => (view ? bento(view.insights) : null), [view]);
  // Flash transactions that arrived since the previous update (derived while rendering).
  const refs = view?.transactions.map((t) => t.ref).join('|');
  if (view && refs !== (seen ? [...seen.refs].join('|') : undefined)) {
    const now = new Set(view.transactions.map((t) => t.ref));
    setSeen({ refs: now, fresh: seen ? new Set([...now].filter((r) => !seen.refs.has(r))) : new Set() });
  }

  const layout = local ?? view?.layout ?? normalizeLayout(null);
  async function save(next: DashboardLayout) {
    setLocal(next);
    const result = await act({ type: 'layout', layout: next });
    setSaveError(result.ok ? '' : `Tata letak belum tersimpan: ${result.message}`);
    setLocal(null);
  }
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const order = arrayMove(layout.order, layout.order.indexOf(active.id as CardId), layout.order.indexOf(over.id as CardId));
    void save({ ...layout, order });
  }
  const visible = layout.order.filter((c) => !layout.hidden.includes(c));

  function card(id: CardId) {
    if (!view || !data) return null;
    const panel = { ...FONTS, colors: data.colors, className: 'h-full' };
    switch (id) {
      case 'saldo':
        return <Balances view={view} />;
      case 'dana-masuk':
        return <RevenuePanel {...panel} revenue={data.revenue} />;
      case 'aktivitas':
        return <SessionsPanel {...panel} sessions={data.sessions} />;
      case 'asnaf':
        return <CategoriesPanel {...panel} categories={data.categories} />;
      case 'ritme':
        return <SeasonalityPanel {...panel} seasonality={data.seasonality} />;
      case 'tugas':
        return <Tasks view={view} onSimulator={onSimulator} />;
      case 'transaksi':
        return <Transactions view={view} fresh={seen?.fresh ?? new Set()} />;
      case 'audit':
        return <Audit view={view} />;
      case 'tim':
        return <Team view={view} />;
      case 'akses':
        return <Shortcuts onSimulator={onSimulator} />;
    }
  }

  return (
    <section className="zo-overview" aria-label="Dashboard">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="zo-eyebrow">IKHTISAR AMANAH</p>
          <h2 className="text-2xl font-bold tracking-[-0.03em]">Hari ini di kantor Zaky</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-muted-foreground">
            <span className={`size-2 rounded-full ${live ? 'bg-primary' : 'bg-muted-foreground'}`} />
            {live ? 'Tersinkron langsung' : 'Menyambung ulang...'} · data simulasi
          </span>
          {view && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold ${view.brokenAt ? 'bg-red-50 text-red-700' : 'bg-accent text-accent-foreground'}`}>
              {view.brokenAt ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
              {view.brokenAt ? `Rantai audit rusak di #${view.brokenAt}` : 'Rantai audit utuh'}
            </span>
          )}
          <button className="zo-btn zo-btn-secondary" aria-pressed={editing} onClick={() => setEditing((v) => !v)}>
            <LayoutGrid size={16} /> {editing ? 'Selesai' : 'Atur dashboard'}
          </button>
          {onSimulator && (
            <button className="zo-btn" onClick={onSimulator}>
              <Boxes size={16} /> Buka simulator
            </button>
          )}
        </div>
      </header>
      {editing && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[20px] border border-dashed border-border bg-card p-3 text-sm">
          <span className="mr-1 text-muted-foreground">Seret ⠿ untuk memindahkan kartu. Kartu tersembunyi:</span>
          {layout.hidden.length ? (
            layout.hidden.map((id) => (
              <button
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 hover:bg-muted"
                onClick={() => void save({ ...layout, hidden: layout.hidden.filter((h) => h !== id) })}
              >
                <Eye size={14} /> {TITLE[id]}
              </button>
            ))
          ) : (
            <span className="text-muted-foreground">tidak ada</span>
          )}
          <button
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-accent-foreground hover:bg-muted"
            onClick={() => void save({ order: [...DASHBOARD_CARDS], hidden: [] })}
          >
            <RotateCcw size={14} /> Atur ulang
          </button>
        </div>
      )}
      {(error || saveError) && (
        <p className="zo-notice" role="alert">
          {error || saveError}
        </p>
      )}
      {!view ? (
        !error && <p className="zo-loading" role="status">Memuat dashboard...</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <SortableContext items={visible} strategy={rectSortingStrategy}>
            <div className="grid grid-flow-dense grid-cols-12 gap-4">
              {visible.map((id) => (
                <Sortable key={id} id={id} editing={editing} onHide={() => void save({ ...layout, hidden: [...layout.hidden, id] })}>
                  {card(id)}
                </Sortable>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <BentoTheme />
    </section>
  );
}
