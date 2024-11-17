import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth,db } from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { priceId, idToken, couponCode, paymentMethodId } = await req.json();

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

      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      console.log('Created Stripe customer:', customer.id);

      // Regular subscription handling
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        default_payment_method: paymentMethodId,
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
        let proType: 'monthly' | 'yearly' | 'lifetime';
        if (priceId === 'price_1QEXRZ2Mf4JwDdD1pdam2mHo') {
          proType = 'monthly';
        } else if (priceId === 'price_1QEfJH2Mf4JwDdD1j2ME28Fw') {
          proType = 'yearly';
        } else if (priceId === 'price_1QKWqI2Mf4JwDdD1NaOiqhhg') {
          proType = 'lifetime';
        } else {
          throw new Error('Invalid price ID');
        }

        await db.collection('users').doc(uid).update({
          isPro: true,
          isProType: proType,
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
      let proType: 'monthly' | 'yearly' | 'lifetime';
      if (priceId === 'price_1QEXRZ2Mf4JwDdD1pdam2mHo') {
        proType = 'monthly';
      } else if (priceId === 'price_1QEfJH2Mf4JwDdD1j2ME28Fw') {
        proType = 'yearly';
      } else if (priceId === 'price_1QKWqI2Mf4JwDdD1NaOiqhhg') {
        proType = 'lifetime';
      } else {
        throw new Error('Invalid price ID');
      }

      await db.collection('users').doc(uid).update({
        isPro: true,
        isProType: proType,
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
