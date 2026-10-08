import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  assetPrefix: process.env.CATALOG_ASSET_PREFIX || undefined,
  async redirects() { return [{ source: '/', destination: '/makerspace', permanent: false }]; },
  async headers() { return [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  ] }]; },
};
export default config;
