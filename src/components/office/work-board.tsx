'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type CollisionDetection,
  type DragStartEvent,
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
  Check,
  CircleCheck,
  Clock3,
  Eye,
  GripVertical,
  Inbox,
  RotateCcw,
  UserCheck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { STATIONS, STATUS_LABELS, type StationId } from '@/lib/office/model';
import type { WorkItem } from '@/lib/office/workflow';
import type { OfficeWorkflow } from './use-office-workflow';
import { WorkCard, friendly } from './work-queue';
import { CountUp } from './motion';
import { rupiah } from './format';
import './work-board.css';

/** Board lanes follow who holds a task, never the financial stage. */
type Lane = 'open' | 'mine' | 'team' | 'done';
const LANES: { id: Lane; title: string; hint: string; Icon: LucideIcon }[] = [
  { id: 'open', title: 'Belum diambil', hint: 'Seret ke "Tugas saya" untuk mengambil.', Icon: Inbox },
  { id: 'mine', title: 'Tugas saya', hint: 'Seret kembali untuk melepas tugas.', Icon: UserCheck },
  { id: 'team', title: 'Dikerjakan tim', hint: 'Sedang ditangani petugas lain.', Icon: Users },
  { id: 'done', title: 'Selesai', hint: 'Tahap kerja sudah tuntas.', Icon: CircleCheck },
];
function laneOf(w: WorkItem, me: string): Lane {
  if (w.status !== 'open') return 'done';
  if (w.assignedUserId === me) return 'mine';
  if (!w.assignedUserId || !w.eligibleUserIds.includes(w.assignedUserId)) return 'open';
  return 'team';
}
/** Only claim (open to mine) and release (mine to open) are real actions; stages move by themselves. */
function dropAction(from: Lane, to: Lane): 'claim' | 'release' | null {
  if (from === 'open' && to === 'mine') return 'claim';
  if (from === 'mine' && to === 'open') return 'release';
  return null;
}

/** Lanes differ in height, so pick the lane under the pointer; keyboard drags fall back to overlap. */
const laneCollision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

const DONE_PREVIEW = 4;

type WidgetId = 'kpi' | 'board' | 'stages' | 'activity';
const DEFAULT_ORDER: WidgetId[] = ['kpi', 'board', 'stages', 'activity'];
const SPAN: Record<WidgetId, string> = {
  kpi: 'zb-span-12',
  board: 'zb-span-12',
  stages: 'zb-span-5',
  activity: 'zb-span-7',
};

const amountOf = (w: WorkItem) => Number(w.amount) || 0;
const stationTitle = (id: StationId) => STATIONS.find((s) => s.id === id)?.title ?? id;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' mnt lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  return Math.floor(s / 86400) + ' hari lalu';
}
function useSavedOrder(key: string) {
  const [order, setOrder] = useState<WidgetId[]>(DEFAULT_ORDER);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (Array.isArray(saved) && DEFAULT_ORDER.every((id) => saved.includes(id)))
        queueMicrotask(() => setOrder(saved.filter((id: WidgetId) => DEFAULT_ORDER.includes(id))));
    } catch {
      // keep the default order
    }
  }, [key]);
  const save = (next: WidgetId[]) => {
    setOrder(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // storage blocked: the order still applies for this visit
    }
  };
  return [order, save] as const;
}

function Widget({
  id,
  title,
  index,
  extra,
  children,
}: {
  id: WidgetId;
  title: string;
  index: number;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    '--i': index,
  } as CSSProperties;
  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`zb-widget zo-enter ${SPAN[id]} ${isDragging ? 'is-dragging' : ''}`}
      aria-label={title}
    >
      <header className="zb-widget-head">
        <h2>{title}</h2>
        <div className="zb-widget-extra">
          {extra}
          <button
            ref={setActivatorNodeRef}
            className="zb-grip"
            aria-label={`Pindahkan kartu ${title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} aria-hidden="true" />
          </button>
        </div>
      </header>
      {children}
    </section>
  );
}

function TaskCard({
  item,
  me,
  members,
  onOpen,
  locked,
  overlay = false,
}: {
  item: WorkItem;
  me: string;
  members: { id: string; nama: string }[];
  onOpen?: (id: string) => void;
  locked: boolean;
  overlay?: boolean;
}) {
  const lane = laneOf(item, me);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled: overlay || locked || (lane !== 'open' && lane !== 'mine'),
  });
  const owner = members.find((m) => m.id === item.assignedUserId)?.nama;
  const amount = amountOf(item);
  return (
    <motion.article
      ref={overlay ? undefined : setNodeRef}
      initial={false}
      animate={{ opacity: isDragging ? 0.35 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`zb-task ${overlay ? 'is-overlay' : ''} type-${item.referenceType}`}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      aria-label={`${item.code}, ${STATUS_LABELS[item.domainStatus] ?? 'Penerimaan tercatat'}`}
    >
      <div className="zb-task-top">
        <span className="zb-chip">{stationTitle(item.stage)}</span>
        <span className={`zb-type type-${item.referenceType}`}>
          {item.referenceType === 'penerimaan' ? 'Penerimaan' : 'Penyaluran'}
        </span>
      </div>
      <strong className="zb-code">{item.code}</strong>
      <p className="zb-status">{STATUS_LABELS[item.domainStatus] ?? 'Penerimaan tercatat'}</p>
      {(amount > 0 || item.destination) && (
        <p className="zb-meta">
          {amount > 0 && <b>{rupiah(amount)}</b>}
          {item.destination && <span>{item.destination}</span>}
        </p>
      )}
      <footer className="zb-task-foot">
        <span className="zb-owner">
          <i aria-hidden="true">{lane === 'done' ? <Check size={11} aria-hidden="true" /> : owner ? initials(owner) : '?'}</i>
          {lane === 'done' ? 'Tuntas' : (owner ?? 'Belum diambil')}
        </span>
        <span className="zb-time">
          <Clock3 size={11} aria-hidden="true" /> {ago(item.updatedAt)}
        </span>
        {onOpen && (
          <button
            className="zb-open"
            aria-label={`Buka detail ${item.code}`}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={() => onOpen(item.id)}
          >
            <Eye size={14} aria-hidden="true" />
          </button>
        )}
      </footer>
    </motion.article>
  );
}

function LaneColumn({
  lane,
  items,
  dragFrom,
  more,
  children,
}: {
  lane: (typeof LANES)[number];
  items: WorkItem[];
  dragFrom: Lane | null;
  more?: ReactNode;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: lane.id });
  const verdict =
    dragFrom && dragFrom !== lane.id ? (dropAction(dragFrom, lane.id) ? 'allow' : 'deny') : '';
  return (
    <div ref={setNodeRef} className={`zb-lane lane-${lane.id} ${verdict} ${isOver ? 'is-over' : ''}`}>
      <div className="zb-lane-head">
        <lane.Icon size={15} aria-hidden="true" />
        <h3>{lane.title}</h3>
        <span className="zb-count">{items.length}</span>
      </div>
      <p className="zb-lane-hint">{lane.hint}</p>
      <div className="zb-lane-body">
        <AnimatePresence initial={false}>
          {children}
        </AnimatePresence>
        {!items.length && <p className="zb-lane-empty">Kosong</p>}
      </div>
      {more}
    </div>
  );
}

export default function WorkBoard({
  workflow,
  pageKey,
  label,
  emptyText,
  referenceType,
  station,
}: {
  workflow: OfficeWorkflow;
  pageKey: string;
  label: string;
  emptyText: string;
  referenceType?: 'penerimaan' | 'penyaluran';
  station?: StationId;
}) {
  const reduce = useReducedMotion();
  const snapshot = workflow.snapshot;
  const me = snapshot?.actor.id ?? '';
  const members = snapshot?.members ?? [];
  const [order, saveOrder] = useSavedOrder('zaky_ws_layout:' + pageKey);
  const [stage, setStage] = useState<StationId | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<WorkItem | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [note, setNote] = useState('');
  const noteTimer = useRef<number | undefined>(undefined);
  const say = (text: string) => {
    setNote(text);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(''), 5000);
  };
  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  const scoped = useMemo(
    () =>
      (snapshot?.items ?? []).filter(
        (w) => (!referenceType || w.referenceType === referenceType) && (!station || w.stage === station),
      ),
    [snapshot, referenceType, station],
  );
  const visible = stage === 'all' ? scoped : scoped.filter((w) => w.stage === stage);
  const open = scoped.filter((w) => w.status === 'open');
  const stagesPresent = STATIONS.filter((s) => scoped.some((w) => w.stage === s.id));
  const selected = scoped.find((w) => w.id === openId) ?? null;

  const widgetSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const taskSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function onWidgetDrop({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    saveOrder(arrayMove(order, order.indexOf(active.id as WidgetId), order.indexOf(over.id as WidgetId)));
  }
  function onTaskStart({ active }: DragStartEvent) {
    setDragging(scoped.find((w) => w.id === active.id) ?? null);
  }
  async function onTaskDrop({ active, over }: DragEndEvent) {
    const item = scoped.find((w) => w.id === active.id);
    setDragging(null);
    if (!item || !over) return;
    const from = laneOf(item, me),
      to = over.id as Lane;
    if (from === to) return;
    const action = dropAction(from, to);
    if (!action)
      return say(
        'Tahap tidak bisa dipindah dengan seret. Tugas berpindah sendiri setelah konfirmasi saksi dan persetujuan tercatat.',
      );
    if (action === 'claim' && !item.eligibleUserIds.includes(me))
      return say('Peran atau unit Anda tidak memenuhi syarat untuk mengambil tugas ini.');
    await workflow.mutate(item.id, item.version, action);
    say(action === 'claim' ? `Tugas ${item.code} Anda ambil.` : `Tugas ${item.code} dilepas.`);
  }

  const kpis = [
    { label: 'Tugas aktif', value: open.length, note: 'Belum selesai', Icon: Inbox },
    {
      label: 'Belum diambil',
      value: open.filter((w) => laneOf(w, me) === 'open').length,
      note: 'Siap diambil',
      Icon: Clock3,
    },
    {
      label: 'Tugas saya',
      value: open.filter((w) => w.assignedUserId === me).length,
      note: 'Sedang Anda tangani',
      Icon: UserCheck,
    },
    {
      label: 'Nominal dalam proses',
      value: open.reduce((a, w) => a + amountOf(w), 0),
      note: 'Dana belum tuntas',
      Icon: Wallet,
      money: true,
    },
  ];
  const stageCounts = STATIONS.map((s) => ({ ...s, n: open.filter((w) => w.stage === s.id).length }));
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.n));
  const recent = [...scoped].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  const live =
    workflow.connection === 'live'
      ? 'Terhubung langsung'
      : workflow.connection === 'loading'
        ? 'Menghubungkan...'
        : snapshot
          ? 'Tidak terhubung · data terakhir'
          : 'Tidak terhubung';

  function widget(id: WidgetId, index: number) {
    switch (id) {
      case 'kpi':
        return (
          <Widget key={id} id={id} index={index} title="Ringkasan">
            <div className="zb-kpis">
              {kpis.map((k, i) => (
                <div key={k.label} className={`zb-kpi ${i === 0 ? 'lead' : ''}`}>
                  <span className="zb-kpi-icon">
                    <k.Icon size={16} aria-hidden="true" />
                  </span>
                  <small>{k.label}</small>
                  <strong>
                    <CountUp value={k.value} format={k.money ? (n) => rupiah(Math.round(n)) : undefined} />
                  </strong>
                  <em>{k.note}</em>
                </div>
              ))}
            </div>
          </Widget>
        );
      case 'board':
        return (
          <Widget
            key={id}
            id={id}
            index={index}
            title={label}
            extra={
              <span className={'zb-live ' + workflow.connection} role="status">
                <span aria-hidden="true" />
                {live}
              </span>
            }
          >
            {stagesPresent.length > 1 && (
              <LayoutGroup id={'stage-' + pageKey}>
                <div className="zb-filters" role="group" aria-label="Saring tahap">
                  {[{ id: 'all' as const, title: 'Semua' }, ...stagesPresent].map((s) => (
                    <button
                      key={s.id}
                      aria-pressed={stage === s.id}
                      onClick={() => setStage(s.id)}
                    >
                      {stage === s.id && (
                        <motion.span
                          layoutId="zb-filter-pill"
                          className="zb-filter-pill"
                          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }}
                        />
                      )}
                      <span>{s.title}</span>
                    </button>
                  ))}
                </div>
              </LayoutGroup>
            )}
            {!scoped.length ? (
              <p className="zb-empty">{emptyText}</p>
            ) : (
              <DndContext
                sensors={taskSensors}
                collisionDetection={laneCollision}
                onDragStart={onTaskStart}
                onDragCancel={() => setDragging(null)}
                onDragEnd={(e) => void onTaskDrop(e)}
              >
                <LayoutGroup id={'board-' + pageKey}>
                  <div className="zb-board">
                    {LANES.map((lane) => {
                      const all = visible.filter((w) => laneOf(w, me) === lane.id);
                      // Finished work is history: show the latest few so the board stays short.
                      const capped = lane.id === 'done' && !allDone && all.length > DONE_PREVIEW;
                      const list = capped
                        ? [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, DONE_PREVIEW)
                        : all;
                      return (
                        <LaneColumn
                          key={lane.id}
                          lane={lane}
                          items={all}
                          dragFrom={dragging ? laneOf(dragging, me) : null}
                          more={
                            lane.id === 'done' && all.length > DONE_PREVIEW ? (
                              <button className="zb-more" onClick={() => setAllDone((v) => !v)}>
                                {allDone ? 'Tampilkan lebih sedikit' : `Lihat semua (${all.length})`}
                              </button>
                            ) : null
                          }
                        >
                          {list.map((w) => (
                            <TaskCard
                              key={w.id}
                              item={w}
                              me={me}
                              members={members}
                              locked={workflow.sending || workflow.connection !== 'live'}
                              onOpen={setOpenId}
                            />
                          ))}
                        </LaneColumn>
                      );
                    })}
                  </div>
                </LayoutGroup>
                <DragOverlay dropAnimation={reduce ? null : undefined}>
                  {dragging && <TaskCard item={dragging} me={me} members={members} locked overlay />}
                </DragOverlay>
              </DndContext>
            )}
          </Widget>
        );
      case 'stages':
        return (
          <Widget key={id} id={id} index={index} title="Sebaran tahap">
            <ul className="zb-stages">
              {stageCounts.map((s) => (
                <li key={s.id}>
                  <span>{s.title}</span>
                  <span className="zb-bar">
                    <motion.i
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.n / maxStage) * 100}%` }}
                      transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                    />
                  </span>
                  <b>
                    <CountUp value={s.n} />
                  </b>
                </li>
              ))}
            </ul>
          </Widget>
        );
      case 'activity':
        return (
          <Widget key={id} id={id} index={index} title="Aktivitas terbaru">
            {recent.length ? (
              <ol className="zb-activity">
                {recent.map((w) => (
                  <li key={w.id}>
                    <button onClick={() => setOpenId(w.id)}>
                      <span className={`zb-dot type-${w.referenceType}`} aria-hidden="true" />
                      <span className="zb-activity-main">
                        <strong>{w.code}</strong>
                        <small>{STATUS_LABELS[w.domainStatus] ?? 'Penerimaan tercatat'}</small>
                      </span>
                      <span className="zb-time">{ago(w.updatedAt)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="zb-empty">Belum ada aktivitas.</p>
            )}
          </Widget>
        );
    }
  }

  return (
    <div className="zb-root">
      <div className="zb-toolbar">
        <p>
          Seret ikon <GripVertical size={13} aria-hidden="true" /> untuk menyusun kartu. Seret tugas ke
          &quot;Tugas saya&quot; untuk mengambilnya.
        </p>
        {order.join() !== DEFAULT_ORDER.join() && (
          <button className="zb-reset" onClick={() => saveOrder(DEFAULT_ORDER)}>
            <RotateCcw size={14} aria-hidden="true" /> Atur ulang
          </button>
        )}
      </div>
      {workflow.error && (
        <div className="zo-error" role="alert">
          <p>{friendly(workflow.error)}</p>
          {workflow.connection !== 'live' && (
            <button className="zo-retry" onClick={workflow.reconnect}>
              Coba lagi
            </button>
          )}
        </div>
      )}
      <p className="zb-note" role="status" aria-live="polite">
        {note}
      </p>
      <DndContext sensors={widgetSensors} collisionDetection={closestCorners} onDragEnd={onWidgetDrop}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="zb-grid">{order.map((id, i) => widget(id, i))}</div>
        </SortableContext>
      </DndContext>
      <AnimatePresence>
        {selected && snapshot && (
          <motion.div
            className="zb-drawer-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setOpenId(null)}
            onKeyDown={(e) => e.key === 'Escape' && setOpenId(null)}
          >
            <motion.aside
              className="zb-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={`Detail tugas ${selected.code}`}
              initial={{ x: reduce ? 0 : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: reduce ? 0 : '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <header>
                <h2>Detail tugas</h2>
                <button autoFocus aria-label="Tutup detail" onClick={() => setOpenId(null)}>
                  <X size={18} aria-hidden="true" />
                </button>
              </header>
              <WorkCard item={selected} workflow={workflow} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
