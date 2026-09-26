import type { Metadata } from 'next';
import { pageMetadata } from '../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'How It Works | Helix',
  description:
    'Make a digital business card, share it by QR code, NFC tap, or link, and scan the cards and badges you collect into contacts you can export.',
  path: '/how-it-works',
});

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
