import { createHash } from 'crypto';
import { db } from '../lib/firebase-admin';

export interface LifetimeCouponUsage {
  uid: string;
  email: string;
  name: string;
  claimedAt: Date;
  couponCode: string;
  priceId: string;
  subscriptionType: string;
}

/**
 * Stable, non-reversible fingerprint of an email address.
 *
 * Redemption records outlive the account that created them (they stop a coupon
 * being reused), so when an account is deleted the plain email and name are
 * stripped and only this fingerprint remains.
 */
export function hashCouponEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export interface LifetimeCouponStats {
  couponCode: string;
  totalUses: number;
  createdAt: Date;
  lastUsedAt: Date;
}

/**
 * Check if a coupon has been used by a specific user
 */
export async function hasUserUsedCoupon(couponCode: string, uid: string): Promise<boolean> {
  try {
    const usage = await db.collection('lifetimesubs')
      .doc(couponCode)
      .collection('customers')
      .doc(uid)
      .get();
    
    return usage.exists;
  } catch (error) {
    console.error('Error checking coupon usage by UID:', error);
    throw error;
  }
}

/**
 * Check if a coupon has been used by a specific email
 */
export async function hasEmailUsedCoupon(couponCode: string, email: string): Promise<boolean> {
  try {
    const customers = db.collection('lifetimesubs')
      .doc(couponCode)
      .collection('customers');

    // Records belonging to deleted accounts keep only the hashed address.
    const [byEmail, byHash] = await Promise.all([
      customers.where('email', '==', email).limit(1).get(),
      customers.where('emailHash', '==', hashCouponEmail(email)).limit(1).get(),
    ]);

    return !byEmail.empty || !byHash.empty;
  } catch (error) {
    console.error('Error checking coupon usage by email:', error);
    throw error;
  }
}

/**
 * Record a coupon redemption
 */
export async function recordCouponRedemption(
  couponCode: string,
  uid: string,
  email: string,
  name: string,
  priceId: string
): Promise<void> {
  try {
    // Record the individual usage
    await db.collection('lifetimesubs')
      .doc(couponCode)
      .collection('customers')
      .doc(uid)
      .set({
        uid: uid,
        email: email,
        emailHash: hashCouponEmail(email),
        name: name || '',
        claimedAt: new Date(),
        couponCode: couponCode,
        priceId: priceId,
        subscriptionType: 'lifetime'
      });

    // Update the coupon stats
    const couponDocRef = db.collection('lifetimesubs').doc(couponCode);
    const couponDoc = await couponDocRef.get();
    
    if (!couponDoc.exists) {
      await couponDocRef.set({
        couponCode: couponCode,
        totalUses: 1,
        createdAt: new Date(),
        lastUsedAt: new Date()
      });
    } else {
      await couponDocRef.update({
        totalUses: (couponDoc.data()?.totalUses || 0) + 1,
        lastUsedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error recording coupon redemption:', error);
    throw error;
  }
}

/**
 * Get coupon usage statistics
 */
export async function getCouponStats(couponCode: string): Promise<LifetimeCouponStats | null> {
  try {
    const couponDoc = await db.collection('lifetimesubs').doc(couponCode).get();
    
    if (!couponDoc.exists) {
      return null;
    }

    const data = couponDoc.data();
    return {
      couponCode: data?.couponCode || couponCode,
      totalUses: data?.totalUses || 0,
      createdAt: data?.createdAt?.toDate() || new Date(),
      lastUsedAt: data?.lastUsedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting coupon stats:', error);
    throw error;
  }
}

/**
 * Get all users who have used a specific coupon
 */
export async function getCouponUsers(couponCode: string): Promise<LifetimeCouponUsage[]> {
  try {
    const usersSnapshot = await db.collection('lifetimesubs')
      .doc(couponCode)
      .collection('customers')
      .orderBy('claimedAt', 'desc')
      .get();

    return usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: data.uid,
        email: data.email,
        name: data.name,
        claimedAt: data.claimedAt?.toDate() || new Date(),
        couponCode: data.couponCode,
        priceId: data.priceId,
        subscriptionType: data.subscriptionType
      };
    });
  } catch (error) {
    console.error('Error getting coupon users:', error);
    throw error;
  }
}

/**
 * Get list of all lifetime coupons and their basic stats
 */
export async function getAllLifetimeCoupons(): Promise<LifetimeCouponStats[]> {
  try {
    const couponsSnapshot = await db.collection('lifetimesubs').get();
    
    return couponsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        couponCode: data.couponCode || doc.id,
        totalUses: data.totalUses || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUsedAt: data.lastUsedAt?.toDate() || new Date()
      };
    });
  } catch (error) {
    console.error('Error getting all lifetime coupons:', error);
    throw error;
  }
} 
/**
 * Strip personal data from a deleted account's redemption records while keeping
 * enough to stop the same person silently re-claiming a one-per-person coupon.
 */
export async function redactCouponRedemptions(uid: string, email: string): Promise<void> {
  const coupons = await db.collection('lifetimesubs').get();

  await Promise.all(
    coupons.docs.map(async coupon => {
      const record = coupon.ref.collection('customers').doc(uid);
      if (!(await record.get()).exists) return;

      await record.update({
        email: '',
        emailHash: email ? hashCouponEmail(email) : '',
        name: '',
        redactedAt: new Date(),
      });
    })
  );
}
