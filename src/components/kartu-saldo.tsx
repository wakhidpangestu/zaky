import { formatRupiah } from '@/lib/format';

interface KartuSaldoProps {
  nama: string;
  totalMasuk: number;
  tersedia: number;
  dicadangkan: number;
  tersalurkan: number;
}

export default function KartuSaldo({
  nama,
  totalMasuk,
  tersedia,
  dicadangkan,
  tersalurkan,
}: KartuSaldoProps) {
  return (
    <div
      className="bg-surface p-6"
      style={{
        borderRadius: 'var(--zaky-radius-card)',
        boxShadow: 'var(--zaky-shadow-card)',
      }}
    >
      {/* Judul */}
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">{nama}</h3>

      {/* Total masuk */}
      <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-neutral-300">
        <span className="text-sm text-neutral-600">Total masuk</span>
        <span className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
          {formatRupiah(totalMasuk)}
        </span>
      </div>

      {/* Tiga saldo */}
      <div className="space-y-3">
        {/* Tersedia */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-full border-2 border-primary-700 flex-shrink-0" />
            <span className="text-sm text-neutral-600">Tersedia</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900 font-mono tabular-nums">
            {formatRupiah(tersedia)}
          </span>
        </div>

        {/* Dicadangkan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, var(--zaky-accent-500) 50%, transparent 50%)`,
                border: '2px dashed var(--zaky-accent-500)',
              }}
            />
            <span className="text-sm text-neutral-600">Dicadangkan</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900 font-mono tabular-nums">
            {formatRupiah(dicadangkan)}
          </span>
        </div>

        {/* Tersalurkan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-full bg-primary-700 flex-shrink-0" />
            <span className="text-sm text-neutral-600">Tersalurkan</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900 font-mono tabular-nums">
            {formatRupiah(tersalurkan)}
          </span>
        </div>
      </div>
    </div>
  );
}
