'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X as XIcon } from 'react-feather';
import type { BusinessCard } from '../types';
import CardPreviewFrame from './CardPreviewFrame';

const LARGE_SCREEN_QUERY = '(min-width: 1024px)';

function subscribeToLargeScreen(onChange: () => void) {
  const query = window.matchMedia(LARGE_SCREEN_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * Mirrors Tailwind's `lg` breakpoint so the preview and the form grid agree.
 * The server snapshot is `false`, so a server-rendered page hydrates cleanly
 * and then flips to the real value in the same commit cycle.
 */
function useIsLargeScreen() {
  return useSyncExternalStore(
    subscribeToLargeScreen,
    () => window.matchMedia(LARGE_SCREEN_QUERY).matches,
    () => false,
  );
}

interface LiveCardPreviewProps {
  card: BusinessCard;
  isPro: boolean;
  /** Below the `lg` breakpoint the preview lives in a bottom sheet; the form owns this state. */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function LiveCardPreview({ card, isPro, mobileOpen = false, onMobileClose }: LiveCardPreviewProps) {
  const isLarge = useIsLargeScreen();
  const sheetOpen = !isLarge && mobileOpen;

  // While the sheet is open: lock page scroll and close on Escape.
  useEffect(() => {
    if (!sheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sheetOpen, onMobileClose]);

  if (isLarge) {
    return (
      <aside className="sticky top-6 self-start lg:col-start-2 lg:row-start-1" aria-label="Live card preview">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Live preview</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Updates as you type. Save to publish.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>

        {/* Phone frame */}
        <CardPreviewFrame card={card} isPro={isPro} title="Unsaved card preview" screenClassName="h-[min(720px,calc(100vh-10rem))]" />
      </aside>
    );
  }

  return (
    <AnimatePresence>
      {mobileOpen && (
        <motion.div
          key="live-preview-sheet"
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Live card preview"
        >
          <motion.button
            type="button"
            aria-label="Close preview"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onMobileClose}
          />
          <motion.div
            className="relative flex h-[92dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl dark:bg-[#1e1f23]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="relative flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 pb-3 pt-4 dark:border-white/10">
              <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-300 dark:bg-white/20" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight">Live preview</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Unsaved changes show here. Save to publish.</p>
              </div>
              <button
                type="button"
                onClick={onMobileClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                aria-label="Close preview"
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-white">
              <CardPreviewFrame card={card} isPro={isPro} title="Unsaved card preview" frame="none" className="h-full" onEscape={onMobileClose} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
