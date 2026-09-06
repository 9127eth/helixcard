export interface CardThemeDefinition {
  id: string;
  name: string;
  description: string;
  /** CSS background used for the swatch in the theme picker */
  preview: string;
}

/**
 * Designs are the static identity of a card: palette, typography, surface.
 * Motion lives in a separate axis (see cardEffects.ts) so any design can be
 * paired with any effect.
 */
export const CARD_THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional black and white theme',
    preview: 'linear-gradient(135deg, #ffffff 50%, #111111 50%)',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'A modern look with blue-green accents',
    preview: 'linear-gradient(135deg, #F5FDFD, #7CCEDA)',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark colors with shades of black and gray',
    preview: 'linear-gradient(135deg, #2c2d31, #4a5568)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm dusk gradient with terracotta accents',
    preview: 'linear-gradient(160deg, #FFF6EC, #F8A98F)',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep evergreen tones with golden accents',
    preview: 'linear-gradient(160deg, #16281F 55%, #D9B45B)',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Ivory paper and classic serif type, like a magazine',
    preview: 'linear-gradient(135deg, #F7F3EA 70%, #B3261E 70%)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Night sky washed with teal and violet northern lights',
    preview: 'linear-gradient(130deg, #0B1026, #0F4D3C, #3B1F5E)',
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Near-black with monospace type and a magenta-cyan glow',
    preview: 'linear-gradient(135deg, #0A0A12 40%, #F472B6 75%, #22D3EE)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Sunlit aqua with soft teal and blue currents',
    preview: 'linear-gradient(160deg, #E7F8FA, #2DD4BF)',
  },
] as const satisfies readonly CardThemeDefinition[];

export type CardTheme = (typeof CARD_THEMES)[number]['id'];
