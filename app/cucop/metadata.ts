import type { Metadata } from 'next';

export const metadata: Metadata = {
  // This page publishes a coupon code and is shared directly with the chapter it
  // belongs to, so it is kept out of search results. See the matching
  // X-Robots-Tag header in next.config.mjs.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  title: 'CU Anschutz Skaggs School of Pharmacy | Official Digital Business Card',
  description: 'The official digital business card for CU Anschutz Skaggs School of Pharmacy APhA Fundraiser - create your card and support the American Pharmacists Association chapter.',
  openGraph: {
    title: 'CU Anschutz Skaggs School of Pharmacy | Official Digital Business Card',
    description: 'The official digital business card for CU Anschutz Skaggs School of Pharmacy APhA Fundraiser - create your card and support the American Pharmacists Association chapter.',
    images: [{
      url: '/logo.png',
      width: 1200,
      height: 630,
      alt: 'CU Anschutz Skaggs School of Pharmacy Digital Business Card'
    }],
    url: 'https://www.helixcard.app/cucop',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CU Anschutz Skaggs School of Pharmacy | Official Digital Business Card',
    description: 'The official digital business card for CU Anschutz Skaggs School of Pharmacy APhA Fundraiser - create your card and support the American Pharmacists Association chapter.',
    images: ['/logo.png'],
  },
};
