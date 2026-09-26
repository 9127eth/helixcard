import type { Metadata } from 'next';
import { NOINDEX } from '../lib/seo';

export const metadata: Metadata = {
  title: 'Verify Your Email | Helix',
  robots: NOINDEX,
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
