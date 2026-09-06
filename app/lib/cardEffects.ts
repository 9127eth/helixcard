export interface CardEffectDefinition {
  id: string;
  name: string;
  description: string;
  /** Short cue shown in the picker telling the user how to trigger it */
  interaction: string;
}

/**
 * Effects are the motion/interaction layer of a card. They are independent of
 * the design (theme): any effect can be paired with any design, and every
 * effect reads its colors from the design's CSS variables so the pairing
 * always looks intentional.
 */
export const CARD_EFFECTS = [
  {
    id: 'none',
    name: 'None',
    description: 'Just the design, no motion.',
    interaction: '',
  },
  {
    id: 'portal',
    name: 'Portal · Deep Space',
    description:
      'Press and hold to open a hole in the card and look into deep space behind it, then drag the hole around.',
    interaction: 'Press & hold, then drag',
  },
  {
    id: 'portal-grid',
    name: 'Portal · The Grid',
    description:
      'Press and hold to open a hole into a still neon wireframe dimension waiting behind the card.',
    interaction: 'Press & hold, then drag',
  },
  {
    id: 'holo',
    name: 'Holographic',
    description:
      'A foil sheen and subtle 3D tilt that respond to how you hold your phone, or to the mouse on desktop.',
    interaction: 'Tilt your phone / move the mouse',
  },
  {
    id: 'stardust',
    name: 'Stardust',
    description:
      'Your finger leaves a glowing trail of sparks in the card’s colors. Tap empty space for a burst.',
    interaction: 'Drag or tap',
  },
  {
    id: 'scramble',
    name: 'Scramble',
    description:
      'Drag across the card and the words you pass over dissolve into cipher characters, then decode themselves back.',
    interaction: 'Drag over text',
  },
  {
    id: 'repel',
    name: 'Repel',
    description:
      'Everything you drag near gets pushed out of the way like a magnet, then springs back into place.',
    interaction: 'Drag near elements',
  },
  {
    id: 'shatter',
    name: 'Shatter',
    description: 'Whatever you drag across crumbles into dust and re-forms a moment later.',
    interaction: 'Drag over elements',
  },
] as const satisfies readonly CardEffectDefinition[];

export type CardEffect = (typeof CARD_EFFECTS)[number]['id'];

export const DEFAULT_CARD_EFFECT: CardEffect = 'none';

export const FREE_CARD_EFFECTS: readonly CardEffect[] = ['none', 'portal-grid', 'repel'];

export function isProCardEffect(effect: string): boolean {
  return !FREE_CARD_EFFECTS.includes(effect as CardEffect);
}

export function getAvailableCardEffect(effect: unknown, isPro: boolean): CardEffect {
  if (!CARD_EFFECTS.some(option => option.id === effect)) return DEFAULT_CARD_EFFECT;
  return isPro || !isProCardEffect(effect as string) ? effect as CardEffect : DEFAULT_CARD_EFFECT;
}
