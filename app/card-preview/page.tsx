import type { Metadata } from 'next';
import DraftCardPreview from './preview';

export const metadata: Metadata = {
  title: 'Card design preview',
  robots: { index: false, follow: false },
};

export default function CardPreviewPage() {
  return <DraftCardPreview />;
}
