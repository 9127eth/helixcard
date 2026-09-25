'use client';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X as XIcon } from 'react-feather';
import { AuthModal } from '../AuthModal';
import { schibsted } from './fonts';
import styles from './home.module.css';

export type AuthMode = 'signup' | 'login';

interface AuthDialogProps {
  /** The form to open on, or null when the dialog is closed. */
  mode: AuthMode | null;
  onClose: () => void;
}

/** Sign up or log in without leaving the page: a bottom sheet on phones, a centered card on larger screens. */
export default function AuthDialog({ mode, onClose }: AuthDialogProps) {
  return (
    <DialogPrimitive.Root open={mode !== null} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={`${styles.overlay} fixed inset-0 z-50 bg-black/50`} />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={`${schibsted.variable} ${styles.tokens} ${styles.auth} ${styles.sheet} fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-[26px] bg-[var(--hx-paper)] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 focus:outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(28rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[26px] sm:p-8`}
        >
          <DialogPrimitive.Title className="sr-only">
            {mode === 'login' ? 'Log in to Helix' : 'Make your free Helix card'}
          </DialogPrimitive.Title>
          {/* Remount per mode so "Log in" in the header always opens the log-in form. */}
          {mode && <AuthModal key={mode} initialMode={mode} variant="plain" />}
          <DialogPrimitive.Close
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--hx-muted)] transition-colors hover:bg-[var(--hx-face)] hover:text-[var(--hx-ink)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hx-handle)]"
            aria-label="Close"
          >
            <XIcon size={20} aria-hidden />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
