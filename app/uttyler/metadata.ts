import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UT Tyler APhA Fundraiser | Official Digital Business Card',
  description: 'The official digital business card for UT Tyler APhA Fundraiser - create your card and support the American Pharmacists Association chapter.',
  openGraph: {
    title: 'UT Tyler APhA Fundraiser | Official Digital Business Card',
    description: 'The official digital business card for UT Tyler APhA Fundraiser - create your card and support the American Pharmacists Association chapter.',
    images: [{
      url: '/logo.png',
      width: 1200,
      height: 630,
      alt: 'UT Tyler APhA Digital Business Card'
    }],
    url: 'https://helixcard.app/uttyler',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UT Tyler APhA Fundraiser | Official Digital Business Card',
    description: 'The official digital business card for UT Tyler APhA Fundraiser - create your card and support the American Pharmacists Association chapter.',
    images: ['/logo.png'],
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#00377B', // UT Tyler blue color
}; 