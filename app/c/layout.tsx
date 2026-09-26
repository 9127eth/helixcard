import type { Metadata } from 'next';

// Cards are for the people their owners share them with, not for search
// results: they carry names, phone numbers, emails, and photos. See the
// matching X-Robots-Tag header in next.config.mjs.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    noimageindex: true,
    googleBot: { index: false, follow: false, noarchive: true, noimageindex: true },
  },
};

export default function CardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
