import { ASNAF, WIB, type Insights } from './simulator.ts';
import type { SimWorld } from './sim-world.ts';

const DAY = 864e5;
const dayStart = (t: number) => t - ((t + WIB) % DAY);
const hourOf = (t: number) => new Date(t + WIB).getUTCHours();
// Monday first, as the dashboard shows Sen..Min.
const weekdayOf = (t: number) => (new Date(t + WIB).getUTCDay() + 6) % 7;

/** Aggregates the whole office history for the dashboard; cheap enough to run per request. */
export function insights(w: SimWorld, now: number): Insights {
  const today = dayStart(now);
  const out = w.cases.filter((c) => c.stage === 'terbit');
  const daily = Array.from({ length: 30 }, (_, i) => ({ day: today - (29 - i) * DAY, masuk: 0, keluar: 0 }));
  const slot = (t: number) => daily[29 - Math.round((today - dayStart(t)) / DAY)];
  for (const r of w.receipts) {
    const d = slot(r.at);
    if (d) d.masuk += r.nominal;
  }
  for (const c of out) {
    const d = slot(c.updatedAt);
    if (d) d.keluar += c.nominal;
  }
  const hours = () => Array.from({ length: 3 }, () => new Array(25).fill(0) as number[]);
  const hourly = { masuk: hours(), keluar: hours() };
  const back = (t: number) => Math.round((today - dayStart(t)) / DAY);
  for (const r of w.receipts) if (back(r.at) < 3) hourly.masuk[back(r.at)][hourOf(r.at)]++;
  for (const c of w.cases)
    for (const h of c.history) if (back(h.at) < 3) hourly.keluar[back(h.at)][hourOf(h.at)]++;
  const since = (days: number) => now - days * DAY;
  const between = (t: number, from: number, to: number) => t >= from && t < to;
  const sum = <T,>(list: T[], pick: (x: T) => number) => list.reduce((a, x) => a + pick(x), 0);
  const window = (from: number, to: number) => ({
    keluar: sum(out.filter((c) => between(c.updatedAt, from, to)), (c) => c.nominal),
    masuk: sum(w.receipts.filter((r) => between(r.at, from, to)), (r) => r.nominal),
    zakat: sum(w.receipts.filter((r) => r.fund === 'zakat' && between(r.at, from, to)), (r) => r.nominal),
    infak: sum(w.receipts.filter((r) => r.fund === 'infak' && between(r.at, from, to)), (r) => r.nominal),
  });
  const p7 = window(since(7), now + 1),
    p30 = window(since(30), now + 1),
    all = window(0, now + 1);
  const weekday = { masuk: new Array(7).fill(0) as number[], keluar: new Array(7).fill(0) as number[] };
  for (const r of w.receipts) if (r.at >= since(30)) weekday.masuk[weekdayOf(r.at)] += r.nominal;
  for (const c of out) if (c.updatedAt >= since(30)) weekday.keluar[weekdayOf(c.updatedAt)] += c.nominal;
  const roles = { petugas: 0, saksi: 0, penyetuju: 0 };
  for (const e of w.audit)
    if (e.at >= since(30) && e.role !== 'sistem' && e.role !== 'pengamat') roles[e.role]++;
  return {
    daily,
    hourly,
    activity: {
      week: w.audit.filter((e) => e.at >= since(7)).length,
      prevWeek: w.audit.filter((e) => between(e.at, since(14), since(7))).length,
    },
    asnaf: ASNAF.map((name) => {
      const mine = out.filter((c) => c.asnaf === name);
      return {
        name,
        values: [
          sum(mine.filter((c) => c.updatedAt >= since(7)), (c) => c.nominal),
          sum(mine.filter((c) => c.updatedAt >= since(30)), (c) => c.nominal),
          sum(mine, (c) => c.nominal),
        ] as [number, number, number],
      };
    }).filter((a) => a.values[2] > 0),
    periods: [
      { label: '7 hari', ...p7, prev: window(since(14), since(7)).keluar },
      { label: '30 hari', ...p30, prev: window(since(60), since(30)).keluar },
      { label: 'Semua', ...all, prev: 0 },
    ],
    weekday,
    roles,
    counts: {
      masuk: w.receipts.filter((r) => r.at >= since(30)).length,
      keluar: out.filter((c) => c.updatedAt >= since(30)).length,
      amil: sum(w.receipts.filter((r) => r.at >= since(30)), (r) => r.amil),
    },
  };
}
