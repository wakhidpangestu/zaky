import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP tanpa nonce agar halaman tetap statis (nonce memaksa render dinamis).
// Semua aset self-hosted; 'unsafe-inline' script dibutuhkan payload RSC Next.js.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  compress: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Aset statis ber-hash dan media publik: cache panjang.
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|glb|gltf|woff2|mp4|webm)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000" }],
      },
      // API publik baca-saja dapat dipanggil dari aplikasi web pihak ketiga (tanpa cookie).
      // Aturan ini sesudah aturan global sehingga menimpa Cross-Origin-Resource-Policy.
      ...["/api/publik/:path*", "/api/health", "/openapi.json"].map((source) => ({
        source,
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      })),
    ];
  },
};

export default nextConfig;
