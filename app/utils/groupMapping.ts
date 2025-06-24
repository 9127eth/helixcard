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
  'EMPRX25': 'emprx-subscribers'
};

// Map source parameters to their respective groups
export const SOURCE_GROUPS: Record<string, string> = {
  'lipscomb': 'lipscomb-university',
  'uttyler': 'ut-tyler', 
  'vmcrx': 'vmcrx-partners',
  'nhma': 'nhma-members',
  'emprx': 'emprx-subscribers',
  'partner1': 'partner-network-1',
  'partner2': 'partner-network-2',
  'affiliate1': 'affiliate-program-1'
};

/**
 * Get group from coupon code
 */
export function getGroupFromCoupon(couponCode: string): string | null {
  return COUPON_GROUPS[couponCode] || null;
}

/**
 * Get group from source parameter
 */
export function getGroupFromSource(source: string): string | null {
  return SOURCE_GROUPS[source] || null;
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