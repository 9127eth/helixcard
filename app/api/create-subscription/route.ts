import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth,db } from '../../lib/firebase-admin';
import { hasUserUsedCoupon, hasEmailUsedCoupon, recordCouponRedemption } from '../../utils/lifetimeCoupons';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Define restricted coupon code mappings
const COUPON_RESTRICTIONS: Record<string, string[]> = {
  'LIPSCOMB25': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'UTTYLER25': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'VMCRX': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'NHMA25': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'EMPRX25': ['price_1QEXRZ2Mf4JwDdD1pdam2mHo', 'price_1QEfJH2Mf4JwDdD1j2ME28Fw'], // Monthly & Yearly
}

export async function POST(req: Request) {
  try {
    const { priceId, idToken, couponCode, paymentMethodId, isFreeSubscription } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Handle free VMCRX subscription
    if (isFreeSubscription && couponCode === 'VMCRX' && priceId === 'price_1QKWqI2Mf4JwDdD1NaOiqhhg') {
      try {
        // Check if user already has an active subscription
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        
        if (userData?.isPro) {
          return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
        }

        // Check if this coupon has been used by this user or email before
        const [userUsed, emailUsed] = await Promise.all([
          hasUserUsedCoupon(couponCode, uid),
          hasEmailUsedCoupon(couponCode, decodedToken.email || '')
        ]);

        if (userUsed) {
          return NextResponse.json({ error: 'You have already used this coupon code' }, { status: 400 });
        }

        if (emailUsed) {
          return NextResponse.json({ error: 'This email has already been used with this coupon code' }, { status: 400 });
        }

        // Record the coupon redemption
        await recordCouponRedemption(
          couponCode,
          uid,
          decodedToken.email || '',
          decodedToken.name || '',
          priceId
        );

        // Update user's subscription status in Firebase
        await db.collection('users').doc(uid).update({
          isPro: true,
          isProType: 'lifetime',
          subscriptionType: 'lifetime',
          couponUsed: couponCode,
          subscriptionCreatedAt: new Date(),
          lifetimePurchase: true
        });

        // Update Firebase Auth custom claims
        await auth.setCustomUserClaims(uid, { isPro: true });

        return NextResponse.json({
          success: true,
          subscriptionType: 'lifetime',
          message: 'Free lifetime subscription activated successfully!',
        });

      } catch (error) {
        console.error('Error creating free subscription:', error);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }
    }

    try {
      // Check coupon code validity if provided
      if (couponCode) {
        try {
          // First, retrieve the promotion code
          const promotionCodes = await stripe.promotionCodes.list({
            code: couponCode,
            active: true,
          });

          if (promotionCodes.data.length === 0) {
            return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
          }

          const promoCode = promotionCodes.data[0];
          const couponId = promoCode.coupon.id;

          // Then retrieve the coupon using the coupon ID
          const coupon = await stripe.coupons.retrieve(couponId);
          
          if (!coupon.valid) {
            return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
          }

          // Check custom coupon restrictions first
          if (COUPON_RESTRICTIONS[couponCode] && !COUPON_RESTRICTIONS[couponCode].includes(priceId)) {
            return NextResponse.json({ 
              error: 'This coupon code is not valid for the selected product type' 
            }, { status: 400 });
          }

          // Get the price to check product restrictions
          const price = await stripe.prices.retrieve(priceId);
          
          // Check if the coupon has product restrictions
          if (coupon.applies_to && coupon.applies_to.products && coupon.applies_to.products.length > 0) {
            // Check if the price's product is in the allowed products list
            if (!coupon.applies_to.products.includes(price.product as string)) {
              return NextResponse.json({ 
                error: 'This coupon code is not valid for the selected product type' 
              }, { status: 400 });
            }
          }
        } catch (error) {
          console.error('Error validating coupon code:', error);
          return NextResponse.json({ error: 'Error validating coupon code' }, { status: 400 });
        }
      }

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

      // Check if it's a lifetime subscription (one-time payment)
      if (priceId === 'price_1QKWqI2Mf4JwDdD1NaOiqhhg') {
        // Create a payment intent for one-time payment instead of subscription
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 1999, // Amount from getPriceInCents in StripePaymentForm
          currency: 'usd',
          customer: customer.id,
          payment_method: paymentMethodId,
          confirmation_method: 'manual',
          confirm: true,
          payment_method_types: ['card'],
          metadata: {
            firebaseUID: uid,
            priceId: priceId,
            type: 'lifetime'
          }
        });

        // Update Firebase user
        await db.collection('users').doc(uid).update({
          isPro: true,
          isProType: 'lifetime',
          stripeCustomerId: customer.id,
          lifetimePurchase: true,
        });

        await auth.setCustomUserClaims(uid, { isPro: true });

        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
          success: true
        });
      }

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
