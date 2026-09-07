'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'react-feather';
import { Sparkles } from 'lucide-react';
import { getCardEffectDefinition } from '../lib/cardEffects';
import type { CardEffect } from '../types';

/**
 * The effects tour lets a visitor browse every effect from the card footer.
 * It is Helix's demo rather than the owner's setting: the card always opens
 * on the effect its owner chose and nothing here is saved. It deliberately
 * says nothing about tiers; the upsell lives in the editor, not on the card.
 *
 * Both pieces carry `data-fx-ignore` (effects leave their text alone and skip
 * presses on them) and `data-fx-control` (they keep working inside the
 * editor's click-guarded preview).
 */

export const EffectTourTrigger: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="fx-tour fx-tour-btn gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
  >
    <Sparkles size={13} aria-hidden />
    Try the other effects
  </button>
);

interface EffectTourControlsProps {
  /** The effect currently showing on the tour. */
  effect: CardEffect;
  /** The effect the owner chose, so the tour can say when it has come back around to it. */
  cardEffect: CardEffect;
  /** `dock` sits in the footer; `float` is the compact copy pinned to the viewport. */
  variant: 'dock' | 'float';
  onPrevious: () => void;
  onNext: () => void;
  onDone: () => void;
}

export const EffectTourControls: React.FC<EffectTourControlsProps> = ({ effect, cardEffect, variant, onPrevious, onNext, onDone }) => {
  const definition = getCardEffectDefinition(effect);
  if (!definition) return null;
  const onThisCard = effect === cardEffect;
  const doneLabel = cardEffect === 'none' ? 'Done' : 'Back to this card’s effect';

  if (variant === 'float') {
    return (
      <div role="group" aria-label="Effects tour" className="flex items-center gap-1 rounded-full p-1">
        <button type="button" aria-label="Previous effect" onClick={onPrevious} className="fx-tour-btn h-8 w-8">
          <ChevronLeft size={15} aria-hidden />
        </button>
        <div className="min-w-[8.5rem] max-w-[11rem] px-1 text-center leading-tight" aria-live="polite">
          <div className="truncate text-xs font-semibold">{definition.name}</div>
          <p className="truncate text-[10px] opacity-75">
            {onThisCard ? 'On this card' : definition.interaction}
          </p>
        </div>
        <button type="button" aria-label="Next effect" onClick={onNext} className="fx-tour-btn h-8 w-8">
          <ChevronRight size={15} aria-hidden />
        </button>
        <button type="button" aria-label={doneLabel} onClick={onDone} className="fx-tour-btn h-8 w-8">
          <X size={14} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div role="group" aria-label="Effects tour" className="fx-tour flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Previous effect" onClick={onPrevious} className="fx-tour-btn h-8 w-8">
          <ChevronLeft size={16} aria-hidden />
        </button>
        <div className="min-w-[10rem] text-center" aria-live="polite">
          <div className="text-sm font-semibold">{definition.name}</div>
          <p className="text-[11px] text-[var(--header-footer-secondary-text)]">
            {definition.interaction}
            {onThisCard && ' · on this card'}
          </p>
        </div>
        <button type="button" aria-label="Next effect" onClick={onNext} className="fx-tour-btn h-8 w-8">
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={onDone}
        className="text-[11px] font-medium text-[var(--header-footer-secondary-text)] underline decoration-current/40 underline-offset-2 transition hover:text-[var(--header-footer-primary-text)]"
      >
        {doneLabel}
      </button>
    </div>
  );
};
