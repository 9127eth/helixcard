/**
 * Central URL/link safety helpers.
 *
 * Card owners control every link that appears on their public card, so every
 * value that ends up in an `href` has to be constrained to a safe scheme.
 * Without this, a card owner can store `javascript:...` (React 18 only warns,
 * it still renders the attribute) and turn a public card into stored XSS.
 */

const SAFE_WEB_PROTOCOLS = ['http:', 'https:'];

/** Anything of the shape `scheme:` at the start of the string. */
const HAS_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/** Control characters and spaces are how `java\nscript:` style bypasses are built. */
const STRIPPED_CHARS = /[\u0000-\u0020\u007f]/g;

/**
 * Returns an http(s) URL, or undefined when the value is missing or uses any
 * other scheme. Values without a scheme are treated as bare hostnames and
 * upgraded to https, which is how the card form has always behaved.
 */
export function sanitizeExternalUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const cleaned = value.replace(STRIPPED_CHARS, '');
  if (!cleaned) return undefined;

  const candidate = HAS_SCHEME.test(cleaned) ? cleaned : `https://${cleaned}`;

  try {
    const parsed = new URL(candidate);
    if (!SAFE_WEB_PROTOCOLS.includes(parsed.protocol)) return undefined;
    if (!parsed.hostname) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/** True when the value is safe to place in an href. */
export function isSafeExternalUrl(value: unknown): boolean {
  return sanitizeExternalUrl(value) !== undefined;
}

/** Digits and the usual dial characters only — never a scheme. */
export function sanitizePhoneNumber(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/[^0-9+()\-.\s]/g, '').trim();
  return cleaned || undefined;
}

/** A conservative single-address check so `mailto:` can never carry a payload. */
export function sanitizeEmailAddress(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length > 254) return undefined;
  if (!/^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/.test(trimmed)) return undefined;
  return trimmed;
}
