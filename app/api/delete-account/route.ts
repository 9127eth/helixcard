import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin, { auth, db, storage } from '../../lib/firebase-admin';
import { redactCouponRedemptions } from '../../utils/lifetimeCoupons';
import { releaseUsernames } from '../../lib/usernames';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Maximum age (in seconds) for the ID token to be considered "recently authenticated".
// We require the client to have re-authenticated recently before deleting an account,
// matching the security posture Firebase enforces for client-side deleteUser().
const MAX_AUTH_AGE_SECONDS = 5 * 60;

/** Every storage prefix an account can own. */
const STORAGE_PREFIXES = ['images', 'docs', 'contacts'];

/**
 * Tear down billing for an account.
 *
 * This must succeed before anything is deleted: the previous implementation
 * logged a Stripe failure and carried on, which could leave a live recurring
 * charge attached to an account that no longer exists — and therefore no way
 * for the user or for support to cancel it.
 */
async function teardownBilling(uid: string): Promise<{ customerId: string | null }> {
  const userData = (await db.collection('users').doc(uid).get()).data();
  const customerId: string | null =
    typeof userData?.stripeCustomerId === 'string' ? userData.stripeCustomerId : null;

  // Cancel every subscription on the customer, not just the last id we stored.
  if (customerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    });

    for (const subscription of subscriptions.data) {
      if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
        continue;
      }
      await stripe.subscriptions.cancel(subscription.id);
    }
  } else if (typeof userData?.stripeSubscriptionId === 'string' && userData.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(userData.stripeSubscriptionId);
  }

  // Deleting the customer also detaches the stored payment methods.
  if (customerId) {
    await stripe.customers.del(customerId);
  }

  return { customerId };
}

export async function POST(req: Request) {
  let uid: string | undefined;

  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the ID token. Pass `true` to also check that it has not been revoked.
    const decodedToken = await auth.verifyIdToken(idToken, true);
    uid = decodedToken.uid;

    // Require recent authentication. `auth_time` is the unix-seconds timestamp of the
    // last sign-in (or re-authentication). The client is expected to call
    // reauthenticateWith{Credential,Popup} immediately before requesting deletion.
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - decodedToken.auth_time > MAX_AUTH_AGE_SECONDS) {
      return NextResponse.json(
        { error: 'requires-recent-login' },
        { status: 401 }
      );
    }

    const userSnapshot = await db.collection('users').doc(uid).get();
    const email = decodedToken.email || userSnapshot.data()?.email || '';
    const deletionRef = db.collection('accountDeletions').doc(uid);

    // 1. Record the request before touching anything. If a later step fails the
    //    record is what lets the next attempt (or an operator) finish the job,
    //    instead of the work being lost in a log line.
    await deletionRef.set({
      uid,
      email,
      stripeCustomerId: userSnapshot.data()?.stripeCustomerId ?? null,
      stripeSubscriptionId: userSnapshot.data()?.stripeSubscriptionId ?? null,
      status: 'pending',
      attempts: admin.firestore.FieldValue.increment(1),
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // 2. Billing first, and it has to succeed.
    try {
      await teardownBilling(uid);
      await deletionRef.update({ status: 'billing_cleared' });
    } catch (stripeErr) {
      console.error('Stripe teardown during account deletion failed:', stripeErr);
      await deletionRef.update({
        status: 'billing_failed',
        lastError: stripeErr instanceof Error ? stripeErr.message : 'Unknown Stripe error',
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json(
        {
          error: 'billing-cleanup-failed',
          detail:
            'We could not cancel your billing with Stripe, so your account was left intact ' +
            'rather than risk an ongoing charge. Please try again in a few minutes.',
        },
        { status: 503 }
      );
    }

    // 3. Recursively delete the user's Firestore data (user doc + all subcollections:
    //    businessCards, contacts, tags, etc.).
    const userRef = db.collection('users').doc(uid);
    await admin.firestore().recursiveDelete(userRef);

    // 4. Release the handle so it can be claimed again, and strip personal data
    //    from the coupon redemption records that outlive the account.
    await releaseUsernames(uid);
    await redactCouponRedemptions(uid, email);

    // 5. Delete the user's Storage files — card images, documents and the
    //    scanned contact images under contacts/{uid}/, which were previously
    //    left behind.
    const bucket = storage.bucket();
    await Promise.all(
      STORAGE_PREFIXES.map(prefix =>
        bucket.deleteFiles({ prefix: `${prefix}/${uid}/` }).catch(err => {
          console.error(`Failed to delete user files under ${prefix}/:`, err);
          throw err;
        })
      )
    );

    // 6. Finally, delete the auth user. Admin SDK is not subject to the
    //    requires-recent-login restriction, so this won't fail for stale sessions.
    await auth.deleteUser(uid);

    await deletionRef.set({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      // The record is kept for audit, but without the personal data.
      email: '',
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);

    if (uid) {
      await db.collection('accountDeletions').doc(uid).set({
        status: 'incomplete',
        lastError: error instanceof Error ? error.message : 'Unknown error',
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }).catch(recordErr => {
        console.error('Failed to record incomplete deletion:', recordErr);
      });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete account', detail: message },
      { status: 500 }
    );
  }
}
