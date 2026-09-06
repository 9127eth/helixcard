/**
 * The only Stripe prices this application will ever transact against.
 *
 * `create-subscription` used to forward whatever `priceId` the browser sent to
 * Stripe, and the webhook fell back to "monthly Pro" for any price it did not
 * recognise — so an unrelated (or cheaper) price could grant a Pro plan. Both
 * ends now resolve the plan through this table and reject anything else.
 */

export type ProPlan = 'monthly' | 'yearly' | 'lifetime';

export const PRICE_IDS = {
  monthly: 'price_1QEXRZ2Mf4JwDdD1pdam2mHo',
  yearly: 'price_1QEfJH2Mf4JwDdD1j2ME28Fw',
  lifetime: 'price_1QKWqI2Mf4JwDdD1NaOiqhhg',
} as const;

/** Price charged for the one-off lifetime purchase, in cents. */
export const LIFETIME_PRICE_CENTS = 1999;

const PLAN_BY_PRICE_ID = new Map<string, ProPlan>(
  Object.entries(PRICE_IDS).map(([plan, priceId]) => [priceId, plan as ProPlan])
);

/** Resolve a price id to a plan, or null when the price is not one of ours. */
export function planForPriceId(priceId: unknown): ProPlan | null {
  if (typeof priceId !== 'string') return null;
  return PLAN_BY_PRICE_ID.get(priceId) ?? null;
}

export function isKnownPriceId(priceId: unknown): boolean {
  return planForPriceId(priceId) !== null;
}

export function isLifetimePriceId(priceId: unknown): boolean {
  return planForPriceId(priceId) === 'lifetime';
}
