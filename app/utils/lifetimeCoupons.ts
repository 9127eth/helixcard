import { createHash } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import type { DocumentData } from 'firebase-admin/firestore';
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
  // With no address there is nothing to compare: '' matches every redacted
  // record, and accounts (Apple sign-in among them) can lack an email.
  if (!email) return false;

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
 * Number of redemption records for a code.
 */
export async function countCouponRedemptions(couponCode: string): Promise<number> {
  const snapshot = await db.collection('lifetimesubs')
    .doc(couponCode)
    .collection('customers')
    .count()
    .get();

  return snapshot.data().count;
}

/**
 * Record a coupon redemption, at most once per account.
 *
 * The record and the stats commit together, and nothing is written when the
 * account already has a record: Stripe redelivers webhooks, and each delivery
 * used to add another use and rewrite `claimedAt`. `userUpdate` is applied to
 * users/{uid} in the same transaction, so a grant that fails cannot leave the
 * code spent.
 *
 * Returns false (having written nothing) when the account already redeemed it.
 */
export async function recordCouponRedemption(
  couponCode: string,
  uid: string,
  email: string,
  name: string,
  priceId: string,
  userUpdate?: DocumentData
): Promise<boolean> {
  try {
    const couponDocRef = db.collection('lifetimesubs').doc(couponCode);
    const recordRef = couponDocRef.collection('customers').doc(uid);

    return await db.runTransaction(async transaction => {
      const [record, couponDoc] = await transaction.getAll(recordRef, couponDocRef);
      if (record.exists) return false;

      const now = new Date();
      transaction.set(recordRef, {
        uid: uid,
        email: email,
        emailHash: email ? hashCouponEmail(email) : '',
        name: name || '',
        claimedAt: now,
        couponCode: couponCode,
        priceId: priceId,
        subscriptionType: 'lifetime'
      });
      transaction.set(couponDocRef, {
        couponCode: couponCode,
        totalUses: FieldValue.increment(1),
        lastUsedAt: now,
        ...(couponDoc.exists ? {} : { createdAt: now }),
      }, { merge: true });

      if (userUpdate) {
        transaction.update(db.collection('users').doc(uid), userUpdate);
      }
      return true;
    });
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
      const snapshot = await record.get();
      if (!snapshot.exists) return;

      // Keep the fingerprint of the address the code was redeemed with. The
      // account's email can have changed since, and hashing the current one
      // instead let the redeeming address claim the code again. (Records made
      // without an address hold the hash of '', which identifies no one.)
      const data = snapshot.data() ?? {};
      const redeemedWith = data.email || email;
      const keptHash = data.emailHash && data.emailHash !== hashCouponEmail('')
        ? data.emailHash
        : '';

      await record.update({
        email: '',
        emailHash: keptHash || (redeemedWith ? hashCouponEmail(redeemedWith) : ''),
        name: '',
        redactedAt: new Date(),
      });
    })
  );
}
