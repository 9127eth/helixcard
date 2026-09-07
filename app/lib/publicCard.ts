import { sanitizeEmailAddress, sanitizeExternalUrl, sanitizePhoneNumber } from './urlSafety';
import { showEffectTour } from './cardEffects';
import type { BusinessCard } from '@/app/types';

/**
 * Every card field that is allowed to reach an unauthenticated visitor.
 *
 * The public routes used to return `{ id, ...doc.data() }`, which leaked any
 * field an owner (or a future migration) happened to write and let arbitrary
 * `href` values through. Everything public now goes through this DTO.
 */

/** Plain text fields, copied through untouched. */
const TEXT_FIELDS = [
  'description',
  'firstName',
  'middleName',
  'lastName',
  'prefix',
  'credentials',
  'pronouns',
  'jobTitle',
  'company',
  'aboutMe',
  'customMessage',
  'customMessageHeader',
  'cvHeader',
  'cvDescription',
  'cvDisplayText',
  'cardSlug',
  'username',
  'theme',
  'effect',
  'cardDepthColor',
] as const;

/** Fields rendered inside an `href` — must be http(s). */
const URL_FIELDS = [
  'facebookUrl',
  'instagramUrl',
  'linkedIn',
  'twitter',
  'tiktokUrl',
  'youtubeUrl',
  'discordUrl',
  'twitchUrl',
  'snapchatUrl',
  'telegramUrl',
  'whatsappUrl',
  'blueskyUrl',
  'threadsUrl',
  'imageUrl',
  'cvUrl',
] as const;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const COLOR_KEYS = ['background', 'button', 'buttonText', 'text', 'icon', 'position'] as const;

function sanitizeCustomColors(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const result: Record<string, string> = {};

  for (const key of COLOR_KEYS) {
    const color = source[key];
    if (typeof color !== 'string' || !HEX_COLOR.test(color)) return null;
    result[key] = color;
  }

  return result;
}

function sanitizeWebLinks(value: unknown): { url: string; displayText: string }[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 25)
    .map(entry => {
      if (!entry || typeof entry !== 'object') return null;
      const link = entry as Record<string, unknown>;
      const url = sanitizeExternalUrl(link.url);
      if (!url) return null;
      const displayText = typeof link.displayText === 'string' ? link.displayText.slice(0, 200) : '';
      return { url, displayText };
    })
    .filter((link): link is { url: string; displayText: string } => link !== null);
}

/**
 * Build the public representation of a business card.
 *
 * `ownerIsPro` comes from the owner's user document (server-controlled via the
 * Stripe webhook), never from the card document, which the owner can write.
 */
export function toPublicCard(
  cardId: string,
  data: FirebaseFirestore.DocumentData,
  ownerIsPro: boolean
): BusinessCard {
  const card: Record<string, unknown> = {
    id: cardId,
    isPrimary: data.isPrimary === true,
    isActive: data.isActive === true,
    isPro: ownerIsPro,
    enableTextMessage: data.enableTextMessage !== false,
    webLinks: sanitizeWebLinks(data.webLinks),
    customColors: ownerIsPro ? sanitizeCustomColors(data.customColors) : null,
    // Only a Pro owner can hide the visitor effects tour; see showEffectTour.
    effectTour: showEffectTour(data.effectTour, ownerIsPro),
  };

  for (const field of TEXT_FIELDS) {
    const value = data[field];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed !== '') card[field] = trimmed;
  }

  for (const field of URL_FIELDS) {
    const url = sanitizeExternalUrl(data[field]);
    if (url) card[field] = url;
  }

  const phone = sanitizePhoneNumber(data.phoneNumber);
  if (phone) card.phoneNumber = phone;

  const email = sanitizeEmailAddress(data.email);
  if (email) card.email = email;

  // Card-level `description` is required by the type but optional in practice.
  if (typeof card.description !== 'string') card.description = '';
  if (typeof card.firstName !== 'string') card.firstName = '';
  if (typeof card.cardSlug !== 'string') card.cardSlug = cardId;

  return card as unknown as BusinessCard;
}
