import { Suspense } from 'react';
import SiteNavbar, { NavbarView } from './site-navbar';
import SiteFooter from './site-footer';
import './site.css';

/** Shell for public pages: liquid navbar, page background, and standard halftone footer. */
export default function SitePage({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className="zs-page">
      <Suspense fallback={<NavbarView path="" active={-1} />}>
        <SiteNavbar />
      </Suspense>
      <main className={'zs-main' + (narrow ? ' zs-narrow' : '')}>{children}</main>
      <SiteFooter />
    </div>
  );
}
