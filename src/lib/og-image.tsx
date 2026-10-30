import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ZAKY_MARK_PATH, ZAKY_TILE } from '@/components/journey/brand';

export const ogSize = { width: 1200, height: 630 };

const fontDir = join(process.cwd(), 'node_modules/@fontsource/outfit/files');
const [extraBold, medium] = await Promise.all([
  readFile(join(fontDir, 'outfit-latin-800-normal.woff')),
  readFile(join(fontDir, 'outfit-latin-500-normal.woff')),
]);

/** Social preview card shared by every public route: brand, eyebrow, two-tone title. */
export function ogImage({
  eyebrow,
  title,
  accent,
}: {
  eyebrow: string;
  title: string;
  accent: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          padding: '64px 72px',
          background:
            'radial-gradient(circle at 92% 8%, rgba(22,162,73,0.22), rgba(22,162,73,0) 46%), radial-gradient(circle at 0% 100%, rgba(250,204,21,0.16), rgba(250,204,21,0) 40%), #FAF9F5',
          fontFamily: 'Outfit',
          color: '#05140d',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="64" height="64" viewBox="0 0 1000 1000">
              <rect width="1000" height="1000" rx="220" fill={ZAKY_TILE} />
              <path transform="translate(140 141) scale(0.72)" fill="#fff" fillRule="evenodd" d={ZAKY_MARK_PATH} />
            </svg>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, letterSpacing: -2 }}>
              zaky<span style={{ color: '#16a249' }}>.</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 64,
              alignSelf: 'flex-start',
              padding: '10px 20px',
              borderRadius: 999,
              background: 'rgba(22,162,73,0.12)',
              color: '#0f6b33',
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: 4,
            }}
          >
            {eyebrow.toUpperCase()}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 26,
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -4,
            }}
          >
            <span>{title}</span>
            <span style={{ color: '#16a249' }}>{accent}</span>
          </div>
          <div style={{ display: 'flex', marginTop: 'auto', fontSize: 26, fontWeight: 500, color: '#4b5f57' }}>
            Pencatatan zakat dengan kesaksian antarlembaga
          </div>
        </div>
        {/* Simplified service centre: glass grid tower beside the emerald core. */}
        <div style={{ position: 'absolute', right: 70, bottom: 0, display: 'flex', alignItems: 'flex-end' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              width: 230,
              height: 420,
              padding: 18,
              gap: 12,
              background: '#ffffff',
              borderRadius: '28px 28px 0 0',
              boxShadow: '0 30px 60px rgba(8,60,34,0.18)',
            }}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} style={{ width: 54, height: 46, borderRadius: 8, background: i === 22 || i === 23 ? '#0b2a1c' : '#173c2b' }} />
            ))}
          </div>
          <div style={{ width: 90, height: 500, background: '#16a249', borderRadius: '0 22px 0 0' }} />
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: 'Outfit', data: extraBold, weight: 800, style: 'normal' },
        { name: 'Outfit', data: medium, weight: 500, style: 'normal' },
      ],
    },
  );
}
