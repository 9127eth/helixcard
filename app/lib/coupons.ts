/**
 * Coupon rules shared by /api/verify-coupon and /api/create-subscription.
 *
 * Each route used to keep its own copy of these tables, and the copies drifted:
 * UCONN25 was lifetime-only when verified but unrestricted at purchase.
 *
 * Stripe matches promotion codes case-insensitively, but these tables are keyed
 * by one spelling, so "vmcrx" got Stripe's discount while skipping the
 * restrictions, the free-lifetime check and partner credit. Resolve a code to
 * its canonical spelling before consulting any of them.
 */

import { PRICE_IDS } from './stripePrices';
import { COUPON_GROUPS, TRACKING_ONLY_COUPONS } from '../utils/groupMapping';

/** Codes that may only be used with the listed prices. */
export const COUPON_RESTRICTIONS: Record<string, readonly string[]> = {
  'LIPSCOMB25': [PRICE_IDS.lifetime],
  'UTTYLER25': [PRICE_IDS.lifetime],
  'VMCRX': [PRICE_IDS.lifetime],
  'NHMA25': [PRICE_IDS.lifetime],
  'MCKiS25': [PRICE_IDS.lifetime],
  'NCPA25': [PRICE_IDS.lifetime],
  'UCONN25': [PRICE_IDS.lifetime],
  'EMPRX25': [PRICE_IDS.monthly, PRICE_IDS.yearly],
  'CUCOP@%': [PRICE_IDS.lifetime],
};

/** Partner codes that grant lifetime Pro without a card. */
export const FREE_LIFETIME_COUPONS: readonly string[] = ['VMCRX', 'MCKiS25', 'NCPA25'];

const KNOWN_COUPONS = new Map(
  [...Object.keys(COUPON_RESTRICTIONS), ...Object.keys(COUPON_GROUPS), ...Array.from(TRACKING_ONLY_COUPONS)]
    .map(code => [code.toLowerCase(), code] as const)
);

/**
 * The spelling the app's tables use for a code, whatever case it was typed in.
 * Codes the tables don't list come back unchanged, so pass Stripe's own
 * spelling (`promotionCode.code`) rather than the typed one.
 */
export function canonicalCouponCode(code: string): string {
  return KNOWN_COUPONS.get(code.toLowerCase()) ?? code;
}

/**
 * The canonical spelling of a tracking-only code, or null when `code` is not
 * one. These are not Stripe codes, so the tables are the only authority.
 */
export function findTrackingOnlyCoupon(code: string): string | null {
  const canonical = canonicalCouponCode(code.trim());
  return TRACKING_ONLY_COUPONS.has(canonical) ? canonical : null;
}

export function isFreeLifetimeCoupon(code: string): boolean {
  return FREE_LIFETIME_COUPONS.includes(canonicalCouponCode(code));
}

/** False when the code is restricted to other prices. */
export function couponAllowsPrice(code: string, priceId: string): boolean {
  const allowed = COUPON_RESTRICTIONS[canonicalCouponCode(code)];
  return !allowed || allowed.includes(priceId);
}
