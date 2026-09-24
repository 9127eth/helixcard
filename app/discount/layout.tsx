import type { Metadata } from 'next';

// This page publishes a coupon code and is shared directly with the group it
// belongs to, so it is kept out of search results. See the matching
// X-Robots-Tag header in next.config.mjs.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function udiscountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
