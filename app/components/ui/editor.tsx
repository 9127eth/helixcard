import React from 'react';
import { Zap } from 'react-feather';

// ---------------------------------------------------------------------------
// Shared visual primitives for editing surfaces (card editor, contact modals).
// Every field, button and tile reads from these so the surfaces stay in step.
// ---------------------------------------------------------------------------

export const inputClass =
  'block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#7CCEDA] focus:outline-none focus:ring-4 focus:ring-[#7CCEDA]/25 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:bg-[#1e1f23] dark:text-gray-100 dark:placeholder:text-gray-500 dark:disabled:bg-white/5';
export const textareaClass = `${inputClass} min-h-[88px] resize-y`;
export const labelClass = 'mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300';
export const hintClass = 'mt-1.5 text-xs text-gray-500 dark:text-gray-400';
export const errorTextClass = 'mt-1.5 text-xs font-medium text-red-600 dark:text-red-400';
export const legendClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400';

export const panelClass =
  'rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#2c2d31] dark:shadow-none';
export const iconTileClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300';
export const sectionIconClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7CCEDA]/15 text-[#2E7C89] dark:bg-[#7CCEDA]/10 dark:text-[#7CCEDA]';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:brightness-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 disabled:cursor-not-allowed disabled:opacity-60';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/30 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10';
export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/30 dark:text-gray-200 dark:hover:bg-white/10';
export const btnDangerGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/25 dark:text-red-400 dark:hover:bg-red-500/10';
export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-60';
export const iconButtonClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white';
export const addButtonClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[#7CCEDA] hover:bg-[#7CCEDA]/10 hover:text-[#2E7C89] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/30 dark:border-white/15 dark:text-gray-300 dark:hover:text-[#7CCEDA] sm:w-auto';
export const removeButtonClass =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 dark:hover:bg-red-500/10';

/** `muted` is for accounts that already have Pro: the label still marks the feature, but stops selling it. */
export const ProBadge: React.FC<{ muted?: boolean }> = ({ muted = false }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${muted ? 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400' : 'bg-gradient-to-r from-[#7CCEDA] to-[#6BA5FF] text-gray-900'}`}>
    <Zap size={10} strokeWidth={3} />
    Pro
  </span>
);

export const Field: React.FC<{
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, required, hint, error, className, children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className={labelClass}>
      {label}
      {required && <span className="ml-0.5 text-[#2E7C89] dark:text-[#7CCEDA]" aria-hidden>*</span>}
    </label>
    {children}
    {error ? <p className={errorTextClass}>{error}</p> : hint ? <p className={hintClass}>{hint}</p> : null}
  </div>
);
