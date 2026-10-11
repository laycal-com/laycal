import {withSentryConfig} from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a dev server run beside a production build without sharing .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  webpack: (config: any) => {
    // Ensure blogs directory is included in the build
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Pages removed in the 2026-10 redesign. Their content lives on the landing
  // page now; these keep old links and search results from hitting a 404.
  // /speed-to-lead and /instant-lead-follow-up were rebuilt as real pages:
  // they were earning search traffic, which a redirect to the homepage loses.
  redirects: async () => [
    // The six "X alternative" blog posts were retired on 2026-10-11: they sold
    // Laycal as a dialer replacement and carried claims that were not true.
    { source: '/blogs/justcall-alternatives-2026', destination: '/justcall-alternative', permanent: true },
    { source: '/blogs/nooks-alternative-2026', destination: '/nooks-alternative', permanent: true },
    { source: '/blogs/kixie-alternative-2026', destination: '/compare', permanent: true },
    { source: '/blogs/ringover-alternative-2026', destination: '/compare', permanent: true },
    { source: '/blogs/aloware-alternative-2026', destination: '/compare', permanent: true },
    { source: '/blogs/dialpad-alternative-2026', destination: '/compare', permanent: true },
    // The blog has no posts for now. Temporary, so it can come back at /blogs:
    // remove these two lines and restore the nav, footer and sitemap entries.
    { source: '/blogs', destination: '/', permanent: false },
    { source: '/blog', destination: '/', permanent: false },
    { source: '/features', destination: '/#features', permanent: true },
    { source: '/pricing', destination: '/#pricing', permanent: true },
    { source: '/about', destination: '/', permanent: true },
    { source: '/case-studies', destination: '/', permanent: true },
    { source: '/sdr', destination: '/instant-lead-follow-up', permanent: true },
  ],
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "laycal.com",

  project: "laycal-next",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true
});