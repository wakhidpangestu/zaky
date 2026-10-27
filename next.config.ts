import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // CSS kritis disisipkan ke HTML: menghilangkan permintaan CSS yang
    // memblokir render (temuan PageSpeed "render-blocking requests").
    inlineCss: true,
  },
  // Header keamanan dasar untuk semua rute. CSP penegakan penuh sengaja
  // belum dipasang: aplikasi memakai gaya/skrip sebaris bawaan Next yang
  // membutuhkan nonce per permintaan; memasang CSP tebak-tebakan berisiko
  // memblokir aplikasi. Header di bawah ini aman tanpa pengecualian.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
