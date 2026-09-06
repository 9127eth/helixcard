/**
 * Global Content Security Policy.
 *
 * Card content is user-generated and rendered on public pages, so this is the
 * last line of defence behind the URL sanitising in `app/lib/urlSafety.ts`:
 * `object-src 'none'` and `base-uri 'self'` remove the classic injection
 * primitives, and `form-action 'self'` stops an injected form from posting
 * anywhere else.
 *
 * `'unsafe-inline'` / `'unsafe-eval'` are still required by Next.js's inline
 * bootstrap and by the Stripe and Firebase SDKs; tightening that needs a nonce
 * middleware, which is a separate change.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  [
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    'https://js.stripe.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://apis.google.com',
    'https://*.firebaseapp.com',
    'https://va.vercel-scripts.com',
  ].join(' '),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src \'self\' data: https://fonts.gstatic.com',
  "img-src 'self' data: blob: https:",
  'media-src \'self\' data: blob:',
  [
    "connect-src 'self'",
    'https://*.googleapis.com',
    'https://*.firebaseio.com',
    'https://*.firebasedatabase.app',
    'https://firebasestorage.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://api.stripe.com',
    'https://www.google-analytics.com',
    'https://*.vercel-insights.com',
    'wss://*.firebaseio.com',
  ].join(' '),
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.firebaseapp.com",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'nextjs.org',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_CANONICAL_URL: 'https://www.helixcard.app',
    NEXT_PUBLIC_BASE_URL: 'https://www.helixcard.app',
  },
  async redirects() {
    return [
      // Redirect non-www to www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'helixcard.app',
          },
        ],
        destination: 'https://www.helixcard.app/:path*',
        permanent: true,
        basePath: false,
      },
      // Redirect other common variations
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'helix-card.app',
          },
        ],
        destination: 'https://www.helixcard.app/:path*',
        permanent: true,
        basePath: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/card-preview',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'"),
          },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
