import { sanitizeExternalUrl } from './urlSafety';

/**
 * Every card field that ends up in an `href`, and therefore has to be an
 * http(s) URL by the time it reaches Firestore. Kept in step with the same list
 * in `firestore.rules` and `lib/publicCard.ts`.
 */
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

/**
 * Rewrite a card's link fields into their safe form before saving.
 *
 * A scheme-less value ("linkedin.com/in/me") is upgraded to https; anything
 * that is not http(s) — `javascript:`, `data:` — is dropped to an empty string
 * rather than stored. Firestore rules reject the unsafe forms outright, so this
 * is also what stops a legacy card from becoming unsaveable.
 */
export function normalizeCardUrls<T extends object>(cardData: T): T {
  const result = { ...cardData } as Record<string, unknown>;

  for (const field of URL_FIELDS) {
    if (!(field in result)) continue;
    const value = result[field];
    if (value === undefined || value === null || value === '') continue;
    result[field] = sanitizeExternalUrl(value) ?? '';
  }

  if (Array.isArray(result.webLinks)) {
    // Empty rows are left in place — the form uses them as its blank slot, and
    // the rules and the public DTO both allow/skip them.
    result.webLinks = (result.webLinks as { url?: unknown; displayText?: unknown }[])
      .slice(0, 25)
      .map(link => ({
        url: sanitizeExternalUrl(link?.url) ?? '',
        displayText: typeof link?.displayText === 'string' ? link.displayText : '',
      }));
  }

  return result as T;
}
