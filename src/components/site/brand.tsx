import Link from 'next/link';
import { ZAKY_MARK_PATH, ZAKY_TILE } from '@/components/journey/brand';

/** The Zaky app tile from public/icon.svg. */
export function ZakyMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="1000" height="1000" rx="220" fill={ZAKY_TILE} />
      <path
        transform="translate(140 141) scale(0.72)"
        fill="#fff"
        fillRule="evenodd"
        d={ZAKY_MARK_PATH}
      />
    </svg>
  );
}

/** Mark plus the "zaky." wordmark, linking home. */
export function ZakyBrand({
  size = 30,
  href = '/',
  tone = 'dark',
}: {
  size?: number;
  href?: string;
  /** "light" text for dark surfaces such as the navbar notch */
  tone?: 'dark' | 'light';
}) {
  return (
    <Link
      href={href}
      className={'zs-brand' + (tone === 'light' ? ' zs-brand-light' : '')}
      aria-label="Zaky, ke beranda"
    >
      <ZakyMark size={size} />
      <span>
        zaky<i>.</i>
      </span>
    </Link>
  );
}
