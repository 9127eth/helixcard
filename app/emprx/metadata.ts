import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Empower Rx Conference | Official Digital Business Card',
  description: 'The official digital business card for Empower Rx Conference - network effortlessly with Helix, making sharing your information seamless and memorable.',
  openGraph: {
    title: 'Empower Rx Conference | Official Digital Business Card',
    description: 'The official digital business card for Empower Rx Conference - network effortlessly with Helix, making sharing your information seamless and memorable.',
    images: [{
      url: '/logo.png',
      width: 1200,
      height: 630,
      alt: 'Empower Rx Digital Business Card'
    }],
    url: 'https://helixcard.app/emprx',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Empower Rx Conference | Official Digital Business Card',
    description: 'The official digital business card for Empower Rx Conference - network effortlessly with Helix, making sharing your information seamless and memorable.',
    images: ['/logo.png'],
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#283890',
}; 