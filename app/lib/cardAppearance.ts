import { CARD_EFFECTS, isProCardEffect } from './cardEffects';
import { normalizeCardColors } from './cardColors';

interface AppearanceInput {
  customColors?: unknown;
  effect?: unknown;
}

function sameColors(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  return Object.keys(left).length === Object.keys(right).length &&
    Object.keys(left).every(key => Object.hasOwn(right, key) && left[key] === right[key]);
}

/** Mirrors Firestore permissions and normalizes newly selected colors before saving. */
export function prepareCardAppearance<T extends AppearanceInput>(data: T, isPro: boolean, existing: AppearanceInput = {}): T {
  const result = { ...data };
  if (data.customColors !== undefined && !sameColors(data.customColors, existing.customColors)) {
    if (data.customColors !== null) {
      if (!isPro) throw new Error('Custom card colors require Helix Pro.');
      const colors = normalizeCardColors(data.customColors);
      if (!colors) throw new Error('Enter all six colors as six-digit hex codes.');
      result.customColors = colors;
    }
  }
  if (data.effect !== undefined && data.effect !== existing.effect) {
    if (!CARD_EFFECTS.some(option => option.id === data.effect)) throw new Error('Choose a valid card effect.');
    if (!isPro && isProCardEffect(data.effect as string)) throw new Error('This card effect requires Helix Pro.');
  }
  return result;
}
