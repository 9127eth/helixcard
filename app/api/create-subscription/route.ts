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

    try {
      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        metadata: {
          firebaseUID: uid,
        },
      });

      console.log('Created Stripe customer:', customer.id);

      // Regular subscription handling
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'allow_incomplete',
        expand: ['latest_invoice.payment_intent'],
      };

      if (couponCode) {
        try {
          const promotionCodes = await stripe.promotionCodes.list({
            code: couponCode,
            active: true,
          });

          if (promotionCodes.data.length > 0) {
            const promoCode = promotionCodes.data[0];
            subscriptionData.promotion_code = promoCode.id;
            console.log('Applied promotion code:', promoCode.id);
          }
        } catch (error) {
          console.error('Error applying promotion code:', error);
        }
      }

      console.log('Creating subscription with data:', subscriptionData);
      const subscription = await stripe.subscriptions.create(subscriptionData);
      console.log('Created subscription:', subscription.id);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      console.log('Invoice amount due:', invoice.amount_due);

      // For free subscriptions, we don't need payment intent
      if (invoice.amount_due === 0) {
        // Update Firebase user
        await db.collection('users').doc(uid).update({
          isPro: true,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customer.id,
        });

        await auth.setCustomUserClaims(uid, { isPro: true });

        return NextResponse.json({
          subscriptionId: subscription.id,
          success: true,
          isFreeWithCard: true
        });
      }

      // For paid subscriptions, we need the payment intent
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      if (!paymentIntent?.client_secret) {
        console.error('No payment intent or client secret found');
        throw new Error('No client secret found in payment intent');
      }

      // Update Firebase user
      await db.collection('users').doc(uid).update({
        isPro: true,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
      });

      await auth.setCustomUserClaims(uid, { isPro: true });

      return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        success: true
      });

    } catch (stripeError) {
      console.error('Stripe operation failed:', stripeError);
      return NextResponse.json({ 
        error: stripeError instanceof Error ? stripeError.message : 'Stripe operation failed',
        details: stripeError
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Request processing failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Request processing failed',
      details: error
    }, { status: 400 });
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
