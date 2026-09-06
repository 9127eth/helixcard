import { createHash } from 'crypto';
import { db } from './firebase-admin';

/**
 * Durable, cross-instance usage quotas.
 *
 * The in-memory sliding windows the API routes already use only limit a single
 * serverless instance, so they do very little under real load. These counters
 * live in Firestore (`usageQuotas/{bucket}`), so every instance shares them.
 *
 * The limits are deliberately generous — they are an abuse ceiling, not a
 * product limit. A normal person scanning cards at an event or sharing a card
 * with a room full of people will never reach them.
 */

export interface QuotaRule {
  /** Stable identifier for what is being limited, e.g. `ocr:user:<uid>`. */
  key: string;
  /** Maximum number of calls allowed in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface QuotaResult {
  allowed: boolean;
  /** Seconds until the offending window rolls over. Only set when blocked. */
  retryAfterSeconds: number;
}

const COLLECTION = 'usageQuotas';

/** Firestore document ids cannot contain `/`, and are capped in length. */
function bucketId(key: string, windowStart: number): string {
  const digest = createHash('sha256').update(key).digest('hex').slice(0, 32);
  return `${digest}_${windowStart}`;
}

/**
 * Atomically counts one call against every rule.
 *
 * Fails open: if the quota store is unreachable we let the request through
 * rather than breaking the product for everyone.
 */
export async function consumeQuota(rules: QuotaRule[]): Promise<QuotaResult> {
  if (rules.length === 0) return { allowed: true, retryAfterSeconds: 0 };

  const now = Date.now();

  try {
    return await db.runTransaction(async transaction => {
      const entries = rules.map(rule => {
        const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
        return {
          rule,
          windowStart,
          ref: db.collection(COLLECTION).doc(bucketId(rule.key, windowStart)),
        };
      });

      const snapshots = await Promise.all(entries.map(entry => transaction.get(entry.ref)));

      for (let index = 0; index < entries.length; index += 1) {
        const { rule, windowStart } = entries[index];
        const count = (snapshots[index].data()?.count as number | undefined) ?? 0;

        if (count >= rule.limit) {
          const resetsAt = windowStart + rule.windowMs;
          return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil((resetsAt - now) / 1000)),
          };
        }
      }

      for (let index = 0; index < entries.length; index += 1) {
        const { rule, windowStart, ref } = entries[index];
        const count = (snapshots[index].data()?.count as number | undefined) ?? 0;

        transaction.set(
          ref,
          {
            count: count + 1,
            // `expiresAt` lets a Firestore TTL policy on `usageQuotas` clean
            // these up; nothing in the app reads expired buckets either way.
            expiresAt: new Date(windowStart + rule.windowMs * 2),
          },
          { merge: true }
        );
      }

      return { allowed: true, retryAfterSeconds: 0 };
    });
  } catch (error) {
    console.error('Usage quota check failed; allowing request:', error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Best-effort client IP for quota bucketing. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
