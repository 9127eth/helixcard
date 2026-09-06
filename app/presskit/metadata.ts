import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press Kit | Helix Brand Assets',
  description:
    'Download the official Helix logo and brand colors for press, partnerships, and media use.',
  alternates: {
    canonical: 'https://www.helixcard.app/presskit',
  },
  openGraph: {
    title: 'Press Kit | Helix Brand Assets',
    description:
      'Download the official Helix logo and brand colors for press, partnerships, and media use.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Helix Digital Business Card',
      },
    ],
    url: 'https://www.helixcard.app/presskit',
    siteName: 'HelixCard',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Press Kit | Helix Brand Assets',
    description:
      'Download the official Helix logo and brand colors for press, partnerships, and media use.',
    images: ['/og-image.png'],
  },
};
