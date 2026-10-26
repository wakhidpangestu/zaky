type StatusPenyaluran =
  | 'dibuat'
  | 'menunggu_konfirmasi'
  | 'ditolak_penerima'
  | 'dikonfirmasi'
  | 'disetujui'
  | 'tersalurkan'
  | 'kedaluwarsa'
  | 'dibatalkan';

interface StatusConfig {
  bg: string;
  text: string;
  label: string;
  icon: React.ReactNode;
}

const statusMap: Record<StatusPenyaluran, StatusConfig> = {
  dibuat: {
    bg: 'var(--zaky-status-dibuat-bg)',
    text: 'var(--zaky-status-dibuat-text)',
    label: 'Dibuat',
    icon: <circle cx="6" cy="6" r="3" fill="currentColor" />,
  },
  menunggu_konfirmasi: {
    bg: 'var(--zaky-status-menunggu-bg)',
    text: 'var(--zaky-status-menunggu-text)',
    label: 'Menunggu konfirmasi',
    icon: (
      <>
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  ditolak_penerima: {
    bg: 'var(--zaky-status-ditolak-bg)',
    text: 'var(--zaky-status-ditolak-text)',
    label: 'Ditolak penerima',
    icon: <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
  },
  dikonfirmasi: {
    bg: 'var(--zaky-status-dikonfirmasi-bg)',
    text: 'var(--zaky-status-dikonfirmasi-text)',
    label: 'Dikonfirmasi',
    icon: (
      <>
        <circle cx="4" cy="6" r="2" fill="currentColor" />
        <circle cx="9" cy="6" r="2" fill="currentColor" />
      </>
    ),
  },
  disetujui: {
    bg: 'var(--zaky-status-dikonfirmasi-bg)',
    text: 'var(--zaky-status-dikonfirmasi-text)',
    label: 'Disetujui',
    icon: (
      <path d="M1 6l3 3 5-6M5 6l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  tersalurkan: {
    bg: 'var(--zaky-status-tersalurkan-bg)',
    text: 'var(--zaky-status-tersalurkan-text)',
    label: 'Tersalurkan',
    icon: <path d="M2 6l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  },
  kedaluwarsa: {
    bg: 'var(--zaky-status-kedaluwarsa-bg)',
    text: 'var(--zaky-status-kedaluwarsa-text)',
    label: 'Kedaluwarsa',
    icon: (
      <>
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M3 9l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  dibatalkan: {
    bg: 'var(--zaky-status-kedaluwarsa-bg)',
    text: 'var(--zaky-status-kedaluwarsa-text)',
    label: 'Dibatalkan',
    icon: <path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
  },
};

export default function StatusBadge({ status }: { status: StatusPenyaluran }) {
  const config = statusMap[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium whitespace-nowrap flex-shrink-0"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderRadius: 'var(--zaky-radius-badge)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
        {config.icon}
      </svg>
      {config.label}
    </span>
  );
}
