import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'National Hispanic Medical Association | Official Digital Business Card',
  description: 'The official digital business card for National Hispanic Medical Association - create your card and support NHMA.',
  openGraph: {
    title: 'National Hispanic Medical Association | Official Digital Business Card',
    description: 'The official digital business card for National Hispanic Medical Association - create your card and support NHMA.',
    images: [{
      url: '/NHMA Main Logo.png',
      width: 1200,
      height: 630,
      alt: 'NHMA Digital Business Card'
    }],
    url: 'https://www.helixcard.app/nhma',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'National Hispanic Medical Association | Official Digital Business Card',
    description: 'The official digital business card for National Hispanic Medical Association - create your card and support NHMA.',
    images: ['/NHMA Main Logo.png'],
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#005882', // NHMA blue color
}; 