import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createHash } from 'crypto';
import { auth, db } from '../../lib/firebase-admin';
import { hasUserUsedCoupon, hasEmailUsedCoupon, recordCouponRedemption } from '../../utils/lifetimeCoupons';
import { getGroupFromCoupon, isTrackingOnlyCoupon } from '../../utils/groupMapping';
import { LIFETIME_PRICE_CENTS, PRICE_IDS, planForPriceId } from '../../lib/stripePrices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Define restricted coupon code mappings
const COUPON_RESTRICTIONS: Record<string, string[]> = {
  'LIPSCOMB25': [PRICE_IDS.lifetime],
  'UTTYLER25': [PRICE_IDS.lifetime],
  'VMCRX': [PRICE_IDS.lifetime],
  'NHMA25': [PRICE_IDS.lifetime],
  'MCKiS25': [PRICE_IDS.lifetime],
  'NCPA25': [PRICE_IDS.lifetime],
  'EMPRX25': [PRICE_IDS.monthly, PRICE_IDS.yearly], // Monthly & Yearly
  'CUCOP@%': [PRICE_IDS.lifetime],
}

/** Stripe subscription statuses that mean the user is already paying us. */
const LIVE_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'incomplete',
]);

/**
 * A stable key for this exact purchase attempt.
 *
 * Stripe replays the original response for a repeated key, so a double-click or
 * a network retry can no longer create a second customer, subscription or
 * charge.
 */
function idempotencyKey(...parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

/**
 * Reuse the account's Stripe customer instead of creating a new one per request.
 *
 * Creating a customer on every attempt is what allowed a user to accumulate
 * several customers — and therefore several subscriptions — while the user
 * document only ever remembered the last one.
 */
async function getOrCreateCustomer(
  uid: string,
  email: string | undefined,
  couponCode: string | undefined
): Promise<Stripe.Customer> {
  const userRef = db.collection('users').doc(uid);
  const existingId = (await userRef.get()).data()?.stripeCustomerId;

  if (typeof existingId === 'string' && existingId) {
    try {
      const existing = await stripe.customers.retrieve(existingId);
      if (!existing.deleted) return existing as Stripe.Customer;
    } catch (error) {
      console.error('Stored Stripe customer could not be retrieved:', error);
    }
  }

  const customer = await stripe.customers.create(
    {
      ...(email && { email }),
      metadata: {
        firebaseUID: uid,
        ...(couponCode && { couponCode }),
      },
    },
    { idempotencyKey: idempotencyKey('customer', uid) }
  );

  // Persist the mapping before creating any payment resources. Stripe can
  // deliver their webhooks before this request finishes.
  await userRef.update({ stripeCustomerId: customer.id });

  return customer;
}

/** True when the account already holds an entitlement we should not duplicate. */
async function hasLiveEntitlement(uid: string, customerId?: string): Promise<boolean> {
  const userData = (await db.collection('users').doc(uid).get()).data();

  if (userData?.isPro === true || userData?.lifetimePurchase === true) {
    return true;
  }

  if (!customerId) return false;

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  });

  return subscriptions.data.some((subscription: Stripe.Subscription) =>
    LIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
  );
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

    // Only prices this application sells are ever forwarded to Stripe.
    const plan = planForPriceId(priceId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Handle free VMCRX subscription
    if (isFreeSubscription && (couponCode === 'VMCRX' || couponCode === 'MCKiS25' || couponCode === 'NCPA25') && plan === 'lifetime') {
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

        // Get group assignment from coupon
        const group = getGroupFromCoupon(couponCode);

        // Update user's subscription status in Firebase
        interface UserUpdateData {
          isPro: boolean;
          isProType: 'lifetime';
          subscriptionType: 'lifetime';
          couponUsed: string;
          subscriptionCreatedAt: Date;
          lifetimePurchase: boolean;
          group?: string;
        }

        const updateData: UserUpdateData = {
          isPro: true,
          isProType: 'lifetime',
          subscriptionType: 'lifetime',
          couponUsed: couponCode,
          subscriptionCreatedAt: new Date(),
          lifetimePurchase: true
        };

        // Add group if available
        if (group) {
          updateData.group = group;
        }

        await db.collection('users').doc(uid).update(updateData as unknown as { [key: string]: unknown });

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

    if (typeof paymentMethodId !== 'string' || !paymentMethodId) {
      return NextResponse.json({ error: 'No payment method provided' }, { status: 400 });
    }

    try {
      // Check coupon code validity if provided
      if (couponCode && isTrackingOnlyCoupon(couponCode)) {
        if (COUPON_RESTRICTIONS[couponCode] && !COUPON_RESTRICTIONS[couponCode].includes(priceId)) {
          return NextResponse.json({
            error: 'This coupon code is not valid for the selected product type'
          }, { status: 400 });
        }
      } else if (couponCode) {
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

      const customer = await getOrCreateCustomer(uid, decodedToken.email, couponCode);

      // One paid entitlement per account. Without this an existing subscriber
      // could start a second subscription and be charged twice, while only the
      // most recent id was stored (and therefore cancellable).
      if (await hasLiveEntitlement(uid, customer.id)) {
        return NextResponse.json(
          { error: 'You already have an active Helix Pro subscription' },
          { status: 409 }
        );
      }

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

      // Check if it's a lifetime subscription (one-time payment)
      if (plan === 'lifetime') {
        // Calculate the payment amount, applying coupon discount if applicable
        let paymentAmount = LIFETIME_PRICE_CENTS;

        if (couponCode) {
          try {
            const promotionCodes = await stripe.promotionCodes.list({
              code: couponCode,
              active: true,
            });

            if (promotionCodes.data.length > 0) {
              const promoCode = promotionCodes.data[0];
              const coupon = await stripe.coupons.retrieve(promoCode.coupon.id);

              if (coupon.percent_off) {
                paymentAmount = Math.round(paymentAmount * (1 - coupon.percent_off / 100));
              } else if (coupon.amount_off) {
                paymentAmount = Math.max(0, paymentAmount - coupon.amount_off);
              }
            }
          } catch (error) {
            console.error('Error applying coupon discount:', error);
            // Continue with original amount if coupon application fails
          }
        }

        // Create a payment intent for one-time payment instead of subscription
        const paymentIntent = await stripe.paymentIntents.create(
          {
            amount: paymentAmount,
            currency: 'usd',
            customer: customer.id,
            payment_method: paymentMethodId,
            confirmation_method: 'manual',
            confirm: true,
            payment_method_types: ['card'],
            metadata: {
              firebaseUID: uid,
              priceId: priceId,
              type: 'lifetime',
              ...(couponCode && { couponCode: couponCode })
            }
          },
          {
            idempotencyKey: idempotencyKey(
              'lifetime', uid, priceId, paymentMethodId, couponCode || ''
            ),
          }
        );

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
        metadata: {
          firebaseUID: uid,
        },
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
          }
        } catch (error) {
          console.error('Error applying promotion code:', error);
        }
      }

      const subscription = await stripe.subscriptions.create(subscriptionData, {
        idempotencyKey: idempotencyKey(
          'subscription', uid, priceId, paymentMethodId, couponCode || ''
        ),
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;

      // For free subscriptions (100% discount), activate immediately since no payment is needed
      if (invoice.amount_due === 0) {
        await db.collection('users').doc(uid).update({
          isPro: true,
          isProType: plan,
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

      // For paid subscriptions, return the client secret for payment confirmation
      // isPro will be set by the webhook when payment succeeds
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      if (!paymentIntent?.client_secret) {
        throw new Error('Payment processing error');
      }

      // Only store customer/subscription IDs — isPro set by webhook after payment confirms
      await db.collection('users').doc(uid).update({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
      });

      return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        success: true
      });

    } catch (stripeError) {
      console.error('Stripe operation failed:', stripeError);
      return NextResponse.json({
        error: 'Payment processing failed. Please try again.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Request processing failed:', error);
    return NextResponse.json({
      error: 'Request processing failed. Please try again.'
    }, { status: 400 });
  }
}
