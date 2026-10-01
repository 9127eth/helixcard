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
 * Where a bare handle lives on each platform, as the iOS app builds it
 * (SocialLinkType.baseURL, and formatInput for Bluesky). iOS has no base for
 * Facebook, YouTube or Discord because it treats them as full URLs, yet its
 * formatInput strips those domains before saving; they get that domain back.
 */
const HANDLE_BASE_URLS: Record<string, string> = {
  linkedIn: 'https://www.linkedin.com/in/',
  twitter: 'https://x.com/',
  facebookUrl: 'https://www.facebook.com/',
  instagramUrl: 'https://www.instagram.com/',
  tiktokUrl: 'https://www.tiktok.com/@',
  youtubeUrl: 'https://www.youtube.com/',
  discordUrl: 'https://discord.com/',
  twitchUrl: 'https://www.twitch.tv/',
  snapchatUrl: 'https://www.snapchat.com/add/',
  telegramUrl: 'https://t.me/',
  whatsappUrl: 'https://wa.me/',
  threadsUrl: 'https://www.threads.net/@',
  blueskyUrl: 'https://bsky.app/profile/',
};

/**
 * A social link whose host is a single label ("https://jordan/") is a bare
 * handle that went through the scheme upgrade: iOS stores some platforms that
 * way, and the X field asks for a handle. Rebuild it on the platform's profile
 * URL. Used when saving and again when rendering, for values saved earlier.
 *
 * `url` is the sanitised form of `raw`, the value as stored. The handle is read
 * from `raw` because URL parsing lowercases the host, and some ids (YouTube
 * channel ids) are case-sensitive.
 */
export function repairBareHandle(field: string, url: string, raw: unknown): string {
  const base = HANDLE_BASE_URLS[field];
  if (!base) return url;

  const { hostname, pathname } = new URL(url);
  if (hostname.includes('.')) return url;

  const source = typeof raw === 'string'
    ? raw.trim().replace(/^https?:\/\//i, '').replace(/^@/, '')
    : `${hostname}${pathname}`;
  let handle = source.replace(/\/+$/, '');
  // Like iOS, which drops "in/" from LinkedIn input before adding its base.
  if (field === 'linkedIn') handle = handle.replace(/^in\//, '');
  // iOS strips both "@" and "channel/" from YouTube links. A channel id goes
  // back under /channel/; a plain name is a handle, which YouTube serves at /@.
  if (field === 'youtubeUrl' && !handle.includes('/')) {
    handle = /^UC[\w-]{22}$/.test(handle) ? `channel/${handle}` : `@${handle}`;
  }
  return sanitizeExternalUrl(`${base}${handle}`) ?? url;
}

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
    const url = sanitizeExternalUrl(value);
    result[field] = url ? repairBareHandle(field, url, value) : '';
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
