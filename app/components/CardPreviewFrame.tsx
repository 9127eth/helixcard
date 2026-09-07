'use client';

import { useEffect, useRef, useState } from 'react';
import type { BusinessCard } from '../types';
import { cn } from '../lib/utils';

interface CardPreviewFrameProps {
  card: BusinessCard;
  isPro: boolean;
  title: string;
  className?: string;
  screenClassName?: string;
  frame?: 'always' | 'desktop' | 'none';
  onEscape?: () => void;
}

/** Shared, unscaled phone preview for the editor and saved-card dialog. */
export default function CardPreviewFrame({
  card, isPro, title, className, screenClassName, frame = 'always', onEscape,
}: CardPreviewFrameProps) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframe.current?.contentWindow) return;
      if (event.data?.type === 'helix-preview-ready') {
        setReady(count => count + 1);
        setLoading(false);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  useEffect(() => {
    if (!ready) return;
    iframe.current?.contentWindow?.postMessage(
      { type: 'helix-preview-update', card, isPro },
      window.location.origin,
    );
  }, [card, isPro, ready]);

  useEffect(() => {
    // Keyboard events inside an iframe do not bubble to the surrounding dialog.
    const previewDocument = iframe.current?.contentDocument;
    if (!ready || !previewDocument || !onEscape) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onEscape();
    };
    previewDocument.addEventListener('keydown', onKeyDown);
    return () => previewDocument.removeEventListener('keydown', onKeyDown);
  }, [ready, onEscape]);

  return (
    <div className={cn(
      'relative mx-auto w-full',
      frame === 'always' && 'max-w-[380px] rounded-[2.4rem] bg-gray-950 p-[10px] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.5)] ring-1 ring-black/10 dark:bg-black dark:ring-white/10',
      frame === 'desktop' && 'sm:max-w-[380px] sm:rounded-[2.4rem] sm:bg-gray-950 sm:p-[10px] sm:shadow-[0_30px_60px_-24px_rgba(0,0,0,0.5)] sm:ring-1 sm:ring-black/10 sm:dark:bg-black sm:dark:ring-white/10',
      className,
    )}>
      {frame !== 'none' && (
        <div aria-hidden="true" className={frame === 'desktop' ? 'hidden sm:block' : undefined}>
          <span className="absolute -left-[3px] top-24 h-7 w-[3px] rounded-l-full bg-gray-700" />
          <span className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l-full bg-gray-700" />
          <span className="absolute -left-[3px] top-[13rem] h-12 w-[3px] rounded-l-full bg-gray-700" />
          <span className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-r-full bg-gray-700" />
        </div>
      )}
      <div className={cn(
        'relative h-full overflow-hidden bg-white',
        frame === 'always' && 'rounded-[1.8rem]',
        frame === 'desktop' && 'sm:rounded-[1.8rem]',
      )}>
        {loading && (
          <div role="status" className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#2E7C89] motion-reduce:animate-none" />
            <span className="sr-only">Loading card preview</span>
          </div>
        )}
        <iframe
          ref={iframe}
          src="/card-preview"
          title={title}
          className={cn('block h-full w-full border-0 bg-white', screenClassName)}
          onLoad={() => {
            // Request/ready also handles cached loads and iframe reloads.
            iframe.current?.contentWindow?.postMessage({ type: 'helix-preview-request' }, window.location.origin);
          }}
        />
      </div>
    </div>
  );
}
