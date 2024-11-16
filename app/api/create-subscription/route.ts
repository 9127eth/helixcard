import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth,db } from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { priceId, idToken, isLifetime, couponCode } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      metadata: {
        firebaseUID: uid,
      },
    });

    // Update Firebase user with Stripe customer ID
    await auth.setCustomUserClaims(uid, {
      stripeCustomerId: customer.id
    });

    if (isLifetime) {
      // Handle lifetime subscription with coupon
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: 1999,
        currency: 'usd',
        customer: customer.id,
        payment_method_types: ['card'],
        metadata: {
          firebaseUID: uid,
        },
      };

      // Apply coupon if provided
      if (couponCode) {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          paymentIntentData.amount = calculateDiscountedAmount(1999, coupon);
        }
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      // Update user document
      await db.collection('users').doc(uid).update({
        isPro: true,
        isLifetime: true,
        stripeCustomerId: customer.id,
      });

      await auth.setCustomUserClaims(uid, { isPro: true, isLifetime: true });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
      });
    } else {
      // Handle regular subscription with coupon
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      };

      // Apply coupon if provided
      if (couponCode) {
        try {
          const promotionCodes = await stripe.promotionCodes.list({
            code: couponCode,
            active: true,
          });

          if (promotionCodes.data.length === 0) {
            return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
          }

          const promoCode = promotionCodes.data[0];
          subscriptionData.promotion_code = promoCode.id;
        } catch (error) {
          return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
        }
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      // Update user document
      await db.collection('users').doc(uid).update({
        isPro: true,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
      });

      await auth.setCustomUserClaims(uid, { isPro: true });

      return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    }
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function calculateDiscountedAmount(originalAmount: number, coupon: Stripe.Coupon): number {
  if (coupon.amount_off) {
    return Math.max(0, originalAmount - coupon.amount_off);
  } else if (coupon.percent_off) {
    return Math.round(originalAmount * (1 - coupon.percent_off / 100));
  }
  return originalAmount;
}
