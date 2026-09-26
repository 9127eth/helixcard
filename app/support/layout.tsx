import type { Metadata } from 'next';
import { pageMetadata } from '../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Support | Helix',
  description: 'Answers to common questions about Helix digital business cards, and how to reach us by email or text.',
  path: '/support',
});

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
