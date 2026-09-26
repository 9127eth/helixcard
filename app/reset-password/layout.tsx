import type { Metadata } from 'next';
import { NOINDEX } from '../lib/seo';

export const metadata: Metadata = {
  title: 'Reset Your Password | Helix',
  robots: NOINDEX,
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
