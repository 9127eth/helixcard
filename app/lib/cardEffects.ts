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
    id: 'glitch',
    name: 'Glitch',
    description:
      'Drag across the card and whatever you pass over breaks up like a bad signal: split color channels, torn slices, then it snaps back.',
    interaction: 'Drag over content',
  },
  {
    id: 'lantern-reveal',
    name: 'Lantern · First Light',
    description: 'Only a lantern is visible. Carry it across the card: wherever its light falls stays lit, and once most of the card is lit, first light finishes the rest.',
    interaction: 'Carry the lantern',
  },
  {
    id: 'ripple',
    name: 'Ripple',
    description: 'Glass over water. A tap sends out a ring; dragging leaves a wake that gently bends the card.',
    interaction: 'Tap or drag',
  },
  {
    id: 'black-hole',
    name: 'Black Hole',
    description: 'Hold to pull the card’s contents backwards into a single point. Release and everything returns.',
    interaction: 'Press & hold',
  },
  // Temporarily disabled — keep PrintEffect.tsx / CSS to restore later.
  // {
  //   id: 'print',
  //   name: 'Print',
  //   description: 'Pull the letterpress handle up. The arm arcs, the plate meets the stock, and your card presses into the paper.',
  //   interaction: 'Pull the press up',
  // },
  {
    id: 'take-one',
    name: 'Take One',
    description:
      'A holder on the wall keeps a stack of your cards behind glass. Pull the one waiting in the slot down and out, and it lands on screen.',
    interaction: 'Pull the card down',
  },
  {
    id: 'overgrown',
    name: 'Overgrown',
    description: 'Leaves and vines hide the card. Brush them off the screen; they stay gone until you refresh.',
    interaction: 'Brush the leaves off',
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

export function getCardEffectDefinition(effect: string): CardEffectDefinition | undefined {
  return CARD_EFFECTS.find(option => option.id === effect);
}

/**
 * The effects a visitor can browse from the card footer, in picker order.
 * The saved effect always loads first; the tour is a visitor-side preview
 * that is never persisted and never changes what the owner may save.
 */
export const CARD_EFFECT_TOUR: readonly CardEffect[] = CARD_EFFECTS
  .filter(option => option.id !== 'none')
  .map(option => option.id);

/**
 * The next (or previous) stop on the tour. Starting from the card's own effect
 * with `1` gives the first thing a visitor has not seen; `none` or an unknown
 * value starts at the top of the list.
 */
export function stepEffectTour(effect: string, direction: 1 | -1): CardEffect {
  const length = CARD_EFFECT_TOUR.length;
  const index = CARD_EFFECT_TOUR.indexOf(effect as CardEffect);
  return CARD_EFFECT_TOUR[(index + direction + length) % length];
}

/**
 * Whether visitors see the effects tour on a card. Free cards always show it,
 * like the footer link, since the card is how Helix spreads; a Pro owner may
 * turn it off. A stored `false` is ignored while the owner is not Pro, the same
 * way a paused Pro effect renders as `none`, and comes back when they upgrade.
 */
export function showEffectTour(effectTour: unknown, isPro: boolean): boolean {
  return !(isPro && effectTour === false);
}
