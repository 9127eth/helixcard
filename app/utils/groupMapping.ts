// Group mapping utility for coupons and sources
export interface GroupMapping {
  couponGroups: Record<string, string>;
  sourceGroups: Record<string, string>;
}

// Map coupon codes to their respective groups
export const COUPON_GROUPS: Record<string, string> = {
  'LIPSCOMB25': 'lipscomb-university',
  'UTTYLER25': 'ut-tyler',
  'VMCRX': 'vmcrx-partners',
  'NHMA25': 'nhma-members',
  'MCKiS25': 'mckis-group',
  'NCPA25': 'ncpa-group',
  'UCONN25': 'uconn-apha-asp',
  'EMPRX25': 'emprx-subscribers',
  'CUCOP@%': 'cu-anschutz-skaggs'
};

// Coupons that attribute a purchase without changing the price. Match typed
// codes against these with findTrackingOnlyCoupon (app/lib/coupons.ts).
export const TRACKING_ONLY_COUPONS = new Set(['CUCOP@%']);

// Map source parameters to their respective groups
export const SOURCE_GROUPS: Record<string, string> = {
  'lipscomb': 'lipscomb-university',
  'uttyler': 'ut-tyler', 
  'vmcrx': 'vmcrx-partners',
  'nhma': 'nhma-members',
  'uconn': 'uconn-apha-asp',
  'emprx': 'emprx-subscribers',
  'cucop': 'cu-anschutz-skaggs',
  'partner1': 'partner-network-1',
  'partner2': 'partner-network-2',
  'affiliate1': 'affiliate-program-1'
};

/**
 * Codes and ?source= values arrive in whatever case people type them, so an
 * exact lookup left "?source=Lipscomb" or "vmcrx" without a group.
 */
function findGroup(groups: Record<string, string>, key: string): string | null {
  const wanted = key.toLowerCase();
  const match = Object.keys(groups).find(candidate => candidate.toLowerCase() === wanted);
  return match ? groups[match] : null;
}

/**
 * Get group from coupon code
 */
export function getGroupFromCoupon(couponCode: string): string | null {
  return findGroup(COUPON_GROUPS, couponCode);
}

/**
 * Get group from source parameter
 */
export function getGroupFromSource(source: string): string | null {
  return findGroup(SOURCE_GROUPS, source);
}

/**
 * Determine user's group based on coupon and source
 * Priority: Coupon group > Source group > null
 */
export function determineUserGroup(couponCode?: string, source?: string): string | null {
  // Coupon takes priority over source
  if (couponCode) {
    const couponGroup = getGroupFromCoupon(couponCode);
    if (couponGroup) return couponGroup;
  }
  
  // Fallback to source group
  if (source) {
    const sourceGroup = getGroupFromSource(source);
    if (sourceGroup) return sourceGroup;
  }
  
  return null;
}

/**
 * Get all available groups for reporting
 */
export function getAllGroups(): string[] {
  const couponGroups = Object.values(COUPON_GROUPS);
  const sourceGroups = Object.values(SOURCE_GROUPS);
  return Array.from(new Set([...couponGroups, ...sourceGroups]));
} 