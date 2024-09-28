import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, db } from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Retrieve the user's Stripe customer ID and subscription ID
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData || !userData.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No subscription found for user' }, { status: 404 });
    }

    // Cancel the subscription at the end of the current period
    await stripe.subscriptions.update(userData.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
