'use client';

import { useEffect, useState } from 'react';
import BusinessCardDisplay from '../components/BusinessCardDisplay';
import type { BusinessCard } from '../types';

export default function DraftCardPreview() {
  const [draft, setDraft] = useState<{ card: BusinessCard; isPro: boolean } | null>(null);

  useEffect(() => {
    if (window.parent === window) return;
    // Inside the editor's phone frame: no desktop scrollbars, like a real phone.
    document.documentElement.classList.add('helix-preview-frame');
    const ready = () => window.parent.postMessage({ type: 'helix-preview-ready' }, window.location.origin);
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === 'helix-preview-request') ready();
      if (event.data?.type === 'helix-preview-update' && typeof event.data.card?.firstName === 'string') {
        setDraft({ card: event.data.card, isPro: event.data.isPro === true });
      }
    };
    window.addEventListener('message', receive);
    ready();
    return () => {
      window.removeEventListener('message', receive);
      document.documentElement.classList.remove('helix-preview-frame');
    };
  }, []);

  if (!draft) return <p className="p-4 text-sm">Your card preview will appear here.</p>;
  return <BusinessCardDisplay card={draft.card} isPro={draft.isPro} isPreview />;
}
