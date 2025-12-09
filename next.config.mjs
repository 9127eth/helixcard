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
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
