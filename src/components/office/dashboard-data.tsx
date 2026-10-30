/** Turns the office insights into the props of the dashboard chart panels. */
import type { AnalyticsBentoProps } from '@/components/ui/analytics-bento';
import { ROLE_LABEL, WIB, type Insights } from '@/lib/office/simulator';


export const compact = (n: number) =>
  'Rp ' + new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const day = (t: number) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(t + WIB);
/** "12,5%", "-3,1%" or "baru" when there is nothing to compare with. */
function pct(now: number, before: number) {
  if (!before) return now ? 'baru' : '0%';
  const v = ((now - before) / before) * 100;
  return `${v < 0 ? '-' : ''}${Math.abs(v).toFixed(1).replace('.', ',')}%`;
}
/** Big rupiah figures are shown in millions so the cards stay readable. */
const jt = (n: number) => Math.round(n / 1e5) / 10;
const ASNAF_GROUP: Record<string, string> = {
  Fakir: 'dasar',
  Miskin: 'dasar',
  Mualaf: 'berdaya',
  Riqab: 'berdaya',
  Gharimin: 'berdaya',
  Fisabilillah: 'sabil',
  'Ibnu sabil': 'sabil',
  Amil: 'amil',
};

/** Maps the office insights onto the four bento cards. */
export function bento(i: Insights): Omit<AnalyticsBentoProps, 'className'> {
  const [p7, p30, all] = i.periods;
  const masuk30 = i.daily.reduce((a, d) => a + d.masuk, 0),
    first = i.daily.slice(0, 15).reduce((a, d) => a + d.masuk, 0),
    last = masuk30 - first;
  const roleRows = (['petugas', 'saksi', 'penyetuju'] as const).map((r) => ({
    label: ROLE_LABEL[r],
    value: `${i.roles[r]} aksi`,
  }));
  return {
    currency: 'Rp ',
    revenue: {
      label: 'Dana masuk · 30 hari (juta)',
      value: jt(masuk30),
      delta: pct(last, first),
      note: (
        <>
          {i.counts.masuk} penerimaan · hak amil <span className="text-foreground/80">{compact(i.counts.amil)}</span>
        </>
      ),
      caption: '15 hari terakhir vs sebelumnya',
      series: i.daily.map((d) => ({ label: day(d.day), value: jt(d.masuk) })),
    },
    sessions: {
      label: 'Aktivitas tercatat · 7 hari',
      value: i.activity.week,
      delta: pct(i.activity.week, i.activity.prevWeek),
      note: 'Per jam (WIB), hari ini dan dua hari sebelumnya',
      desktop: i.hourly.masuk,
      mobile: i.hourly.keluar,
      labels: { desktop: 'Penerimaan', mobile: 'Proses penyaluran', prior: 'Hari sebelumnya', current: 'hari ini' },
    },
    categories: {
      title: 'Penyaluran per asnaf (juta)',
      groups: [
        { id: 'dasar', name: 'Kebutuhan dasar', color: 'var(--primary)', ink: 'light' },
        { id: 'berdaya', name: 'Pemberdayaan', color: 'var(--secondary)', ink: 'dark' },
        { id: 'sabil', name: 'Fisabilillah & ibnu sabil', color: 'var(--chart-4)', ink: 'light' },
        { id: 'amil', name: 'Amil', color: 'color-mix(in srgb, var(--muted-foreground) 45%, var(--muted))' },
      ],
      periods: [
        { label: p7.label, total: jt(p7.keluar), delta: pct(p7.keluar, p7.prev), compare: `vs ${compact(p7.prev)} pekan lalu` },
        { label: p30.label, total: jt(p30.keluar), delta: pct(p30.keluar, p30.prev), compare: `vs ${compact(p30.prev)} bulan lalu` },
        { label: all.label, total: jt(all.keluar), delta: '0%', compare: 'Sejak kantor dibuka' },
      ],
      items: i.asnaf.map((a) => ({ name: a.name, group: ASNAF_GROUP[a.name] ?? 'amil', values: a.values.map(jt) })),
      table: {
        columns: ['Pos dana', '7 hari', '30 hari', 'Semua'],
        rows: [
          { label: 'Zakat masuk', values: i.periods.map((p) => compact(p.zakat)) },
          { label: 'Infak masuk', values: i.periods.map((p) => compact(p.infak)) },
          { label: 'Tersalurkan', values: i.periods.map((p) => compact(p.keluar)) },
        ],
      },
    },
    seasonality: {
      title: 'Ritme mingguan (juta)',
      axis: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      years: [
        {
          label: 'Masuk',
          values: i.weekday.masuk.map(jt),
          stats: [
            { label: 'Rata-rata harian', value: jt(p30.masuk / 30), delta: pct(p7.masuk / 7, p30.masuk / 30), note: '7 vs 30 hari' },
            { label: 'Hak amil 30 hari', value: jt(i.counts.amil), delta: pct(p7.masuk, p30.masuk - p7.masuk), note: `${i.counts.masuk} trx` },
          ],
          rows: roleRows,
        },
        {
          label: 'Keluar',
          values: i.weekday.keluar.map(jt),
          stats: [
            { label: 'Rata-rata harian', value: jt(p30.keluar / 30), delta: pct(p7.keluar / 7, p30.keluar / 30), note: '7 vs 30 hari' },
            { label: 'Tersalurkan 30 hari', value: jt(p30.keluar), delta: pct(p30.keluar, p30.prev), note: `${i.counts.keluar} catatan` },
          ],
          rows: roleRows,
        },
      ],
    },
    colors: {
      revenue: ['var(--chart-4)', 'var(--primary)'],
      desktop: ['var(--primary)', 'var(--chart-3)'],
      mobile: ['var(--secondary)', 'var(--chart-5)'],
      radar: 'var(--primary)',
    },
  };
}

