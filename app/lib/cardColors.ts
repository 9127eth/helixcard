import type { CSSProperties } from 'react';
import type { CardTheme } from './cardThemes';

export const CARD_COLOR_FIELDS = [
  { key: 'background', label: 'Background' },
  { key: 'button', label: 'Buttons' },
  { key: 'buttonText', label: 'Button text' },
  { key: 'text', label: 'Regular text' },
  { key: 'icon', label: 'Icons' },
  { key: 'position', label: 'Position & company' },
] as const;

export type CardColorKey = (typeof CARD_COLOR_FIELDS)[number]['key'];
export type CardColors = Record<CardColorKey, string>;

/** Opaque sRGB only. Firestore stores the canonical uppercase #RRGGBB form. */
export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}

export function normalizeCardColors(value: unknown): CardColors | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (Object.keys(source).length !== CARD_COLOR_FIELDS.length) return null;
  const colors = {} as CardColors;
  for (const { key } of CARD_COLOR_FIELDS) {
    const hex = normalizeHexColor(source[key]);
    if (!hex) return null;
    colors[key] = hex;
  }
  return colors;
}

// Solid starting palettes for customization; preset gradients remain unchanged.
export const CARD_COLOR_DEFAULTS: Record<CardTheme, CardColors> = {
  classic: { background: '#FFFFFF', button: '#000000', buttonText: '#FFFFFF', text: '#000000', icon: '#000000', position: '#666666' },
  modern: { background: '#F5FDFD', button: '#7CCEDA', buttonText: '#000000', text: '#333333', icon: '#FC9A99', position: '#666666' },
  dark: { background: '#323338', button: '#40444B', buttonText: '#FFFFFF', text: '#DCDDDE', icon: '#FFFFFF', position: '#B9BBBE' },
  sunset: { background: '#FFF6EC', button: '#C2410C', buttonText: '#FFF7ED', text: '#43302B', icon: '#C2410C', position: '#8A6355' },
  forest: { background: '#16281F', button: '#D9B45B', buttonText: '#1A2B21', text: '#E4EDE2', icon: '#D9B45B', position: '#9FB49D' },
  editorial: { background: '#F7F3EA', button: '#14110C', buttonText: '#F7F3EA', text: '#1A1712', icon: '#B3261E', position: '#8A7F6A' },
  aurora: { background: '#0B1026', button: '#7FF0C3', buttonText: '#0B1026', text: '#E6EEFB', icon: '#7FF0C3', position: '#9FB3D1' },
  neon: { background: '#0A0A12', button: '#22D3EE', buttonText: '#0A0A12', text: '#E8E8F0', icon: '#F472B6', position: '#9BA0B8' },
  ocean: { background: '#E7F8FA', button: '#0E7490', buttonText: '#F0FBFF', text: '#10394A', icon: '#0E7490', position: '#4E7A8A' },
};

export function getCardColorDefaults(theme: string): CardColors {
  return { ...(CARD_COLOR_DEFAULTS[theme as CardTheme] || CARD_COLOR_DEFAULTS.classic) };
}

/** Every public card surface uses these same six colors, even in dark mode. */
export function getCardColorStyle(colors: CardColors): CSSProperties {
  return {
    background: colors.background,
    color: colors.text,
    '--background': colors.background,
    '--foreground': colors.text,
    '--card-header-bg': colors.background,
    '--card-footer-bg': colors.background,
    '--end-card-bg': colors.background,
    '--body-primary-text': colors.text,
    '--header-footer-primary-text': colors.text,
    '--header-footer-secondary-text': colors.text,
    '--end-card-header-secondary-text-color': colors.text,
    '--position-text-color': colors.position,
    '--save-contact-button-bg': colors.button,
    '--save-contact-button-text': colors.buttonText,
    '--send-text-button-bg': colors.button,
    '--send-text-button-text': colors.buttonText,
    '--link-icon-color': colors.icon,
    '--link-text-color': colors.text,
    '--social-icon-color': colors.icon,
    '--social-text-color': colors.text,
    '--social-tile-bg': colors.background,
    '--social-tile-border': colors.icon,
  } as CSSProperties;
}
