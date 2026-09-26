import type { Metadata } from 'next';
import { pageMetadata } from '../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Service | Helix',
  description: 'The terms that govern your use of Helix, the digital business card app from Rx Radio, LLC.',
  path: '/terms-of-service',
});

export default function TermsOfServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
