import type { Metadata } from 'next';
import { pageMetadata } from '../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'NFC Business Cards | Helix',
  description:
    'Tap-to-share NFC cards for your Helix digital business card. One tap on a phone opens your card, and the person you meet doesn’t need an app.',
  path: '/shop',
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
