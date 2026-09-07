'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, ExternalLink, Link as LinkIcon, Smartphone, X } from 'react-feather';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import type { BusinessCard } from '@/app/types';
import CardPreviewFrame from './CardPreviewFrame';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BusinessCard | null;
  username?: string;
}

function PreviewContent({ card, username, onClose }: {
  card: BusinessCard;
  username?: string;
  onClose: () => void;
}) {
  const [view, setView] = useState<'phone' | 'qr'>('phone');
  const [origin, setOrigin] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const trigger = useRef<HTMLElement | null>(null);
  const cardUsername = username || card.username;
  const cardPath = cardUsername && (card.isPrimary || card.cardSlug)
    ? `/c/${encodeURIComponent(cardUsername)}${card.isPrimary ? '' : `/${encodeURIComponent(card.cardSlug)}`}`
    : '';
  const cardUrl = origin && cardPath ? `${origin}${cardPath}` : '';
  const displayUrl = cardUrl.replace(/^https?:\/\/(www\.)?/, '');
  const fullName = [card.firstName, card.lastName].filter(Boolean).join(' ');

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2500);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <Dialog.Content
      className="fixed inset-x-0 bottom-0 z-[60] flex h-[94dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-white font-sans text-gray-900 shadow-2xl outline-none dark:bg-[#1e1f23] dark:text-gray-100 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-[min(940px,92dvh)] sm:w-[calc(100%-3rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:ring-1 sm:ring-black/5 sm:dark:ring-white/10"
      onOpenAutoFocus={() => { trigger.current = document.activeElement as HTMLElement | null; }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        trigger.current?.focus();
      }}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 px-5 pb-3 pt-5 sm:px-6 sm:pb-4">
        <div className="min-w-0">
          <Dialog.Title className="text-lg font-semibold tracking-tight">Card preview</Dialog.Title>
          <Dialog.Description className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
            {[card.description, fullName].filter(Boolean).join(' · ') || 'Your saved card'}
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <button type="button" aria-label="Close preview" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white">
            <X size={18} aria-hidden="true" />
          </button>
        </Dialog.Close>
      </header>

      <div className="flex shrink-0 justify-center border-b border-black/[0.06] px-5 pb-4 dark:border-white/10">
        <div role="group" aria-label="Preview view" className="inline-flex w-full max-w-[300px] gap-1 rounded-xl bg-gray-100 p-1 dark:bg-black/25">
          {([
            { id: 'phone', label: 'Card preview', icon: <Smartphone size={16} aria-hidden="true" /> },
            { id: 'qr', label: 'QR code', icon: <QrCodeIcon className="h-4 w-4" aria-hidden="true" /> },
          ] as const).map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7CCEDA] ${view === id
                ? 'bg-white text-gray-900 shadow-sm dark:bg-[#393a40] dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}`}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-[#f3f4f5] dark:bg-[#151619]">
        {/* Keep the iframe mounted so switching to QR preserves scroll and effects. */}
        <div className={`${view === 'phone' ? 'flex' : 'hidden'} h-full sm:p-6`}>
          <CardPreviewFrame
            card={card}
            isPro={card.isPro === true}
            title="Saved card preview"
            frame="desktop"
            className="h-full"
            onEscape={onClose}
          />
        </div>
        {view === 'qr' && (
          <div className="flex h-full flex-col items-center overflow-y-auto px-6 py-6 text-center">
            <div className="my-auto w-full max-w-[300px] shrink-0">
              <div className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.2)]">
                {cardUrl ? (
                  <QRCodeSVG value={cardUrl} size={256} level="M" marginSize={4} bgColor="#ffffff" fgColor="#111827" title={`QR code for ${fullName || 'your card'}`} className="h-auto w-full" />
                ) : (
                  <p className="py-12 text-sm text-gray-500">Your card link is not available yet.</p>
                )}
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-tight">Scan to view your card</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Open your phone camera and point it at the QR code.</p>
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-black/[0.06] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 dark:border-white/10 dark:bg-[#1e1f23] sm:px-6 sm:pt-4">
        {card.isActive === false && (
          <p className="mb-3 text-center text-xs text-amber-700 dark:text-amber-300">This card is inactive. Activate it to make it visible to visitors.</p>
        )}
        <div className="mb-3 flex min-w-0 items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <LinkIcon size={13} className="shrink-0" aria-hidden="true" />
          <span className="truncate select-all" title={cardUrl}>{displayUrl || 'Card link unavailable'}</span>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button type="button" onClick={copyLink} disabled={!cardUrl} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7CCEDA] px-3 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-[#6fc2cf] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 disabled:opacity-50">
            {copyState === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            <span aria-live="polite">{copyState === 'copied' ? 'Link copied' : 'Copy link'}</span>
          </button>
          <a href={cardUrl || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!cardUrl} className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold transition hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 dark:border-white/15 dark:hover:bg-white/5 ${!cardUrl ? 'pointer-events-none opacity-50' : ''}`}>
            <ExternalLink size={16} aria-hidden="true" />
            Open card
          </a>
        </div>
        {copyState === 'error' && <p role="status" className="mt-2 text-center text-xs text-red-600 dark:text-red-400">Couldn’t copy. Select the link above to copy it manually.</p>}
      </footer>
    </Dialog.Content>
  );
}

export default function PreviewModal({ isOpen, onClose, card, username }: PreviewModalProps) {
  if (!card) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-gray-950/60 backdrop-blur-sm" />
        <PreviewContent key={card.id} card={card} username={username} onClose={onClose} />
      </Dialog.Portal>
    </Dialog.Root>
  );
}
