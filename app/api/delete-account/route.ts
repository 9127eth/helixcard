import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin, { auth, db, storage } from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Maximum age (in seconds) for the ID token to be considered "recently authenticated".
// We require the client to have re-authenticated recently before deleting an account,
// matching the security posture Firebase enforces for client-side deleteUser().
const MAX_AUTH_AGE_SECONDS = 5 * 60;

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the ID token. Pass `true` to also check that it has not been revoked.
    const decodedToken = await auth.verifyIdToken(idToken, true);
    const uid = decodedToken.uid;

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

    // 1. Cancel any active Stripe subscription so the customer is not billed again.
    //    Failures here should not block account deletion (the account itself takes
    //    precedence); we log and continue.
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();
      if (userData?.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(userData.stripeSubscriptionId);
      }
    } catch (stripeErr) {
      console.error('Stripe cancellation during account deletion failed:', stripeErr);
    }

    // 2. Recursively delete the user's Firestore data (user doc + all subcollections:
    //    businessCards, contacts, tags, etc.).
    const userRef = db.collection('users').doc(uid);
    await admin.firestore().recursiveDelete(userRef);

    // 3. Delete the user's Storage files (images and uploaded documents).
    const bucket = storage.bucket();
    await Promise.all([
      bucket.deleteFiles({ prefix: `images/${uid}/` }).catch((err) => {
        console.error('Failed to delete user images:', err);
      }),
      bucket.deleteFiles({ prefix: `docs/${uid}/` }).catch((err) => {
        console.error('Failed to delete user docs:', err);
      }),
    ]);

    // 4. Finally, delete the auth user. Admin SDK is not subject to the
    //    requires-recent-login restriction, so this won't fail for stale sessions.
    await auth.deleteUser(uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete account', detail: message },
      { status: 500 }
    );
  }
}
