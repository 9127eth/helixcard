import type { Metadata } from 'next';
import { pageMetadata } from '../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Helix Pro: Plans and Pricing',
  description:
    'Helix Pro adds up to 10 cards, every effect, custom colors, a PDF on your card, and card scanning. $19.99 once, or $12.99 a year, or $2.99 a month.',
  path: '/get-helix-pro',
});

export default function GetHelixProLayout({ children }: { children: React.ReactNode }) {
  return children;
}
