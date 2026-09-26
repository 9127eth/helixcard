import type { Metadata } from 'next';
import { pageMetadata } from '../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy | Helix',
  description: 'How Rx Radio, LLC, the maker of Helix, collects, uses, shares, and protects your personal information.',
  path: '/privacy-policy',
});

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
