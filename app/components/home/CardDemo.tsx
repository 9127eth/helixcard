'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import CardPreviewFrame from '../CardPreviewFrame';
import { CARD_THEMES } from '../../lib/cardThemes';
import { CARD_EFFECTS, getCardEffectDefinition } from '../../lib/cardEffects';
import { useReducedMotion } from '../effects/surfaceUtils';
import type { BusinessCard, CardEffect, CardTheme } from '../../types';
import styles from './home.module.css';

interface CardDemoProps {
  card: BusinessCard;
  /** The intro and sign-up button: beside the card on wide screens, above it on phones. */
  pitch: React.ReactNode;
}

/**
 * The hero: a real published card, rendered by the same preview route the
 * editor uses, with its design and effect switchable. Only those two fields
 * change; everything else is the card exactly as its owner published it.
 */
export default function CardDemo({ card, pitch }: CardDemoProps) {
  const [theme, setTheme] = useState<CardTheme>(card.theme ?? 'classic');
  const [effect, setEffect] = useState<CardEffect>(card.effect ?? 'none');
  const replay = useRef<number>();
  const reducedMotion = useReducedMotion();

  const previewCard = useMemo(() => ({ ...card, theme, effect }), [card, theme, effect]);
  const activeEffect = effect === 'none' ? undefined : getCardEffectDefinition(effect);

  useEffect(() => () => window.clearTimeout(replay.current), []);

  const chooseEffect = (next: CardEffect) => {
    window.clearTimeout(replay.current);
    if (next !== effect || next === 'none') {
      setEffect(next);
      return;
    }
    // Choosing the running effect again restarts it, so a card that has
    // already been taken, lit, or cleared can be tried again.
    setEffect('none');
    replay.current = window.setTimeout(() => setEffect(next), 250);
  };

  const pickers = (
    <div className="min-w-0 [grid-area:controls] lg:max-w-[22rem] xl:grid xl:max-w-none xl:grid-cols-[22rem_minmax(0,1fr)] xl:gap-x-12">
      <div>
        <h2 id="demo-design" className="text-base font-semibold">
          Try a design
          {/* On phones the card is below the pickers, out of view while you choose. */}
          <span className="font-normal text-[var(--hx-muted)] md:hidden"> (scroll down to see it)</span>
        </h2>
        <div role="group" aria-labelledby="demo-design" className="mt-1 grid grid-cols-3 gap-x-4 gap-y-4 py-3">
          {CARD_THEMES.map(option => {
            const selected = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                title={option.description}
                onClick={() => setTheme(option.id)}
                className="text-left"
              >
                <span className="relative block">
                  <span
                    className="block aspect-[7/4] rounded-[5px] border-[1.5px] border-[var(--hx-ink)]"
                    style={{ background: option.preview }}
                  />
                  {selected && <span aria-hidden className={styles.selectBox} />}
                </span>
                <span className="mt-2 block text-[0.8125rem] font-medium">{option.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 id="demo-effect" className="mt-7 text-base font-semibold xl:mt-0">Try an effect</h2>
        {reducedMotion && (
          <p className="mt-1 text-sm text-[var(--hx-muted)]">
            Your device is set to reduce motion, so effects stay still here.
          </p>
        )}
        {/* The same order as the card’s own effects tour. Wraps on phones, a list beside the card on larger screens. */}
        <div role="group" aria-labelledby="demo-effect" className="mt-2 flex flex-wrap gap-x-5 gap-y-1 md:flex-col md:flex-nowrap md:gap-0">
          {CARD_EFFECTS.map(option => {
            const selected = effect === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseEffect(option.id)}
                className="py-[0.4rem] text-left"
              >
                <span className="relative whitespace-nowrap text-[0.9375rem] font-medium">
                  {option.id === 'none' ? 'No effect' : option.name}
                  {selected && <span aria-hidden className={styles.selectBox} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    /*
     * Phones stack the pickers above the card, so whatever you tap changes the
     * card right below it. Tablets put them beside the card, and large screens
     * under the intro with the card on the right.
     */
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-10 [grid-template-areas:'pitch'_'controls'_'card'] md:grid-cols-[auto_minmax(0,1fr)] md:[grid-template-areas:'pitch_pitch'_'card_controls'] lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-16 lg:[grid-template-areas:'pitch_card'_'controls_card'] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="[grid-area:pitch]">{pitch}</div>

      {pickers}

      {/* Beside the pickers, the card stays in view while you work down the list. */}
      <figure className="w-fit [grid-area:card] md:sticky md:top-6 md:self-start xl:justify-self-center">
        <div className={styles.frame}>
          <div className={styles.screen}>
            <div className={styles.screenInner}>
              <CardPreviewFrame
                card={previewCard}
                isPro
                frame="none"
                title="Jordan Lane’s Helix card, interactive preview"
                className="h-full"
                screenClassName="h-full"
                tabIndex={-1}
              />
            </div>
          </div>
        </div>
        <figcaption className="mt-7 w-0 min-w-full text-sm leading-snug" aria-live="polite">
          {activeEffect ? (
            <>
              <span className="block font-semibold">{activeEffect.name}</span>
              <span className="block text-[var(--hx-muted)]">{activeEffect.interaction}</span>
            </>
          ) : (
            <>
              <span className="block font-semibold">Jordan Lane’s card, live</span>
              <span className="block text-[var(--hx-muted)]">
                {reducedMotion ? 'Try it in another design.' : 'Try it in another design, or add an effect.'}
              </span>
            </>
          )}
        </figcaption>
      </figure>
    </div>
  );
}
