'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpenText,
  ChevronDown,
  Network,
  House,
  ShieldCheck,
  LogIn,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { NotchLeftWing, NotchRightWing } from '@/components/ui/notch-wings';
import { ZakyBrand } from './brand';
import './site.css';

export interface SiteNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Public pages reachable from every navbar outside the dashboard. */
export const PAGE_ITEMS: SiteNavItem[] = [
  { label: 'Beranda', href: '/', icon: House },
  { label: 'Cek Kode', href: '/verifikasi', icon: ShieldCheck },
  { label: 'Papan Silang', href: '/silang', icon: Network },
  { label: 'Dokumentasi', href: '/docs', icon: BookOpenText },
];

/** The link for the current route; -1 on pages outside the menu, like /login. */
function pageIndex(items: SiteNavItem[], path: string) {
  if (path === '/') return items.findIndex((item) => item.href === '/');
  return items.findIndex((item) => item.href !== '/' && path.startsWith(item.href));
}

interface NavbarProps {
  items?: SiteNavItem[];
  /** controlled active link; pages derive it from the route when omitted */
  active?: number;
  onChange?: (index: number) => void;
  signedIn?: boolean;
}

/**
 * Notch navbar for public pages: one notch (brand, menu, action) hanging from the page
 * frame in the same ink, so it reads as part of the background. Below 1280px it is an
 * island whose current-page button opens the menu.
 */
export default function SiteNavbar(props: NavbarProps) {
  const detected = useSignedIn(props.signedIn === undefined);
  return <NavbarView {...props} signedIn={props.signedIn ?? detected} path={usePathname()} />;
}

/**
 * Halaman publik dirender statis, jadi status masuk diambil di klien setelah
 * halaman idle — di luar jalur render kritis.
 */
function useSignedIn(enabled: boolean) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const run = () =>
      fetch('/api/session', { signal: controller.signal, cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setSignedIn(d?.signedIn === true))
        .catch(() => {});
    const idle = window.requestIdleCallback?.(run, { timeout: 4000 });
    const timer = idle === undefined ? window.setTimeout(run, 1500) : undefined;
    return () => {
      controller.abort();
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [enabled]);
  return signedIn;
}

function NavLink({
  item,
  className,
  children,
  onClick,
  current,
}: {
  item: SiteNavItem;
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
  current: boolean;
}) {
  const props = { className, onClick, 'aria-current': current ? ('page' as const) : undefined };
  // Section anchors stay plain links so the browser scrolls within the page.
  return item.href.startsWith('#') ? (
    <a href={item.href} {...props}>
      {children}
    </a>
  ) : (
    <Link href={item.href} {...props}>
      {children}
    </Link>
  );
}

/** Route-independent render, also used as the Suspense fallback on dynamic routes. */
export function NavbarView({
  items = PAGE_ITEMS,
  active,
  onChange,
  signedIn = false,
  path,
}: NavbarProps & { path: string }) {
  const island = useRef<HTMLDivElement>(null),
    [open, setOpen] = useState(false);
  const current = active ?? pageIndex(items, path);
  const activeItem = items[current];
  const cta = signedIn
    ? { href: '/dasbor', label: 'Buka Dasbor', short: 'Dasbor', icon: LayoutGrid }
    : { href: '/login', label: 'Masuk Amil', short: 'Masuk', icon: LogIn };
  const showCta = path !== cta.href;

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!island.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const select = (i: number) => {
    setOpen(false);
    onChange?.(i);
  };
  const Cta = cta.icon;
  const ActiveIcon = activeItem?.icon ?? House;
  // In the phone menu, links within this page and links to other pages are listed apart.
  const groups = [
    { title: 'Di halaman ini', list: items.map((item, i) => ({ item, i })).filter(({ item }) => item.href.startsWith('#')) },
    { title: 'Halaman', list: items.map((item, i) => ({ item, i })).filter(({ item }) => !item.href.startsWith('#')) },
  ].filter((g) => g.list.length);

  return (
    <header className="zn" data-open={open || undefined}>
      <div className="zn-frame" aria-hidden="true" />

      {/* Desktop: one notch with brand, menu and action */}
      <div className="zn-bar">
        <NotchLeftWing className="zn-wing" />
        <NotchRightWing className="zn-wing" />
        <ZakyBrand tone="light" size={28} />
        <nav className="zn-center" aria-label="Navigasi utama">
          <ul>
              {items.map((item, i) => {
                const ItemIcon = item.icon,
                  on = i === current;
                return (
                  <li key={item.label}>
                    <NavLink item={item} current={on} className="zn-item" onClick={() => select(i)}>
                      {/* Pill CSS murni: tanpa pustaka animasi di halaman publik. */}
                      {on && <span className="zn-pill" aria-hidden="true" />}
                      <ItemIcon size={18} strokeWidth={on ? 2.5 : 2} aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
        </nav>
        {showCta && (
          <Link className="zn-cta" href={cta.href}>
            <Cta size={18} strokeWidth={2.5} aria-hidden="true" />
            {cta.label}
          </Link>
        )}
      </div>

      {/* Tablet & phone: one island with the current page as a menu trigger */}
      <div className="zn-island" ref={island}>
        <NotchLeftWing className="zn-wing" />
        <NotchRightWing className="zn-wing" />
        <div className="zn-island-row">
          <ZakyBrand tone="light" size={28} />
          <button
            type="button"
            className="zn-trigger"
            aria-expanded={open}
            aria-controls="zn-drawer"
            aria-label={`Menu, sekarang ${activeItem?.label ?? 'di luar menu'}`}
            onClick={() => setOpen((v) => !v)}
          >
            <ActiveIcon size={18} aria-hidden="true" />
            <span>{activeItem?.label ?? 'Menu'}</span>
            <ChevronDown size={14} strokeWidth={2.5} aria-hidden="true" className="zn-chevron" />
          </button>
          {showCta && (
            <Link className="zn-cta zn-cta-sm" href={cta.href} aria-label={cta.label}>
              <Cta size={18} strokeWidth={2.5} aria-hidden="true" />
              <span>{cta.short}</span>
            </Link>
          )}
        </div>
        <div className="zn-drawer" id="zn-drawer" hidden={!open}>
          {groups.map((g) => (
            <div key={g.title}>
              {groups.length > 1 && <p className="zn-drawer-title">{g.title}</p>}
              <ul>
                {g.list.map(({ item, i }) => {
                  const ItemIcon = item.icon;
                  return (
                    <li key={item.label}>
                      <NavLink
                        item={item}
                        current={i === current}
                        className="zn-drawer-item"
                        onClick={() => select(i)}
                      >
                        <span className="zn-drawer-icon">
                          <ItemIcon size={20} aria-hidden="true" />
                        </span>
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
