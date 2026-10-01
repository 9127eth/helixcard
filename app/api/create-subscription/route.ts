import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createHash } from 'crypto';
import { auth, db } from '../../lib/firebase-admin';
import { syncCardActiveStatus } from '../../lib/adminCards';
import {
  canonicalCouponCode,
  couponAllowsPrice,
  findTrackingOnlyCoupon,
  isFreeLifetimeCoupon,
} from '../../lib/coupons';
import { setProClaim } from '../../lib/proClaims';
import {
  countCouponRedemptions,
  hasUserUsedCoupon,
  hasEmailUsedCoupon,
  recordCouponRedemption,
} from '../../utils/lifetimeCoupons';
import { getGroupFromCoupon } from '../../utils/groupMapping';
import { LIFETIME_PRICE_CENTS, planForPriceId } from '../../lib/stripePrices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/** Stripe subscription statuses that mean the user is already paying us. */
const LIVE_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
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
  email: string | undefined
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

  // No coupon in the metadata: the customer outlives this attempt, and the
  // webhook credited later purchases to a code typed here and then abandoned.
  const customer = await stripe.customers.create(
    {
      ...(email && { email }),
      metadata: {
        firebaseUID: uid,
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

/**
 * Cancel checkouts that never completed.
 *
 * A declined card or an abandoned 3-D Secure challenge leaves the
 * `default_incomplete` subscription `incomplete` for about 23 hours. Counting
 * it as live refused every retry as "already subscribed"; leaving it alone
 * would let it complete on top of the new purchase.
 */
async function cancelIncompleteSubscriptions(customerId: string): Promise<void> {
  const incomplete = await stripe.subscriptions.list({
    customer: customerId,
    status: 'incomplete',
    limit: 100,
  });

  for (const subscription of incomplete.data) {
    await stripe.subscriptions.cancel(subscription.id);
  }
}

/**
 * Stripe enforces a code's expiry and redemption caps only when it redeems the
 * code, and the lifetime and free paths never do: a PaymentIntent takes no
 * promotion code, and the free grant creates nothing in Stripe. Check them
 * against our own redemption records instead.
 */
async function lifetimeCodeLimitError(
  promotionCode: Stripe.PromotionCode,
  coupon: Stripe.Coupon,
  couponCode: string
): Promise<string | null> {
  if (promotionCode.expires_at && promotionCode.expires_at * 1000 <= Date.now()) {
    return 'This code has expired';
  }

  const caps = [promotionCode.max_redemptions, coupon.max_redemptions].filter(
    (cap: unknown): cap is number => typeof cap === 'number'
  );
  if (caps.length > 0 && (await countCouponRedemptions(couponCode)) >= Math.min(...caps)) {
    return 'This code has reached its redemption limit';
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { priceId, idToken, couponCode: rawCouponCode, paymentMethodId, isFreeSubscription } = await req.json();

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

    const typedCode = typeof rawCouponCode === 'string' ? rawCouponCode.trim() : '';

    // Handle free partner lifetime access, claimed without a card
    if (isFreeSubscription && typedCode) {
      try {
        // The promotion has to still be live in Stripe. /api/verify-coupon
        // already requires this before the checkout form offers the free path,
        // but this grant only compared the code against a list — so ending a
        // promotion in Stripe hid it from the form while a direct request here
        // kept handing out lifetime Pro.
        const freePromotion = await stripe.promotionCodes.list({
          code: typedCode,
          active: true,
          limit: 1,
        });
        const freePromotionCode = freePromotion.data[0];
        const freeCoupon = freePromotionCode?.coupon;

        if (!freeCoupon || !freeCoupon.valid) {
          return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
        }

        // Stripe matched the code ignoring case; everything below needs the
        // canonical spelling.
        const couponCode = canonicalCouponCode(freePromotionCode.code);
        if (!isFreeLifetimeCoupon(couponCode) || plan !== 'lifetime') {
          return NextResponse.json(
            { error: 'This code does not include free lifetime access' },
            { status: 400 }
          );
        }

        // Check if user already has an active subscription
        const userDoc = await db.collection('users').doc(uid).get();
        const storedCustomerId = userDoc.data()?.stripeCustomerId;
        const customerId = typeof storedCustomerId === 'string' && storedCustomerId
          ? storedCustomerId
          : undefined;

        if (await hasLiveEntitlement(uid, customerId)) {
          return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
        }

        const limitError = await lifetimeCodeLimitError(freePromotionCode, freeCoupon, couponCode);
        if (limitError) {
          return NextResponse.json({ error: limitError }, { status: 400 });
        }

        // Check if this coupon has been used by this user or email before
        const email = decodedToken.email || '';
        const [userUsed, emailUsed] = await Promise.all([
          hasUserUsedCoupon(couponCode, uid),
          hasEmailUsedCoupon(couponCode, email)
        ]);

        if (userUsed) {
          return NextResponse.json({ error: 'You have already used this coupon code' }, { status: 400 });
        }

        if (emailUsed) {
          return NextResponse.json({ error: 'This email has already been used with this coupon code' }, { status: 400 });
        }

        if (customerId) {
          await cancelIncompleteSubscriptions(customerId);
        }

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

        // Record the redemption and grant Pro in one transaction. Recording
        // first spent the code even when the grant then failed, and every
        // retry was told the code was already used.
        const recorded = await recordCouponRedemption(
          couponCode,
          uid,
          email,
          decodedToken.name || '',
          priceId,
          updateData as unknown as { [key: string]: unknown }
        );

        if (!recorded) {
          return NextResponse.json({ error: 'You have already used this coupon code' }, { status: 400 });
        }

        // Update Firebase Auth custom claims
        await setProClaim(uid, true);

        // Nothing is created in Stripe here, so no webhook follows to
        // reactivate the account's other cards.
        await syncCardActiveStatus(uid);

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
      // The code in its canonical spelling and, for Stripe codes, the
      // validated promotion code and coupon.
      let couponCode: string | undefined;
      let promoCode: Stripe.PromotionCode | undefined;
      let coupon: Stripe.Coupon | undefined;

      // Check coupon code validity if provided
      const trackingOnlyCode = typedCode ? findTrackingOnlyCoupon(typedCode) : null;
      if (trackingOnlyCode) {
        couponCode = trackingOnlyCode;
        if (!couponAllowsPrice(couponCode, priceId)) {
          return NextResponse.json({
            error: 'This coupon code is not valid for the selected product type'
          }, { status: 400 });
        }
      } else if (typedCode) {
        try {
          // First, retrieve the promotion code
          const promotionCodes = await stripe.promotionCodes.list({
            code: typedCode,
            active: true,
          });

          if (promotionCodes.data.length === 0) {
            return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
          }

          promoCode = promotionCodes.data[0];
          // Stripe matched the code ignoring case; the restrictions, partner
          // credit and redemption records need its canonical spelling.
          couponCode = canonicalCouponCode(promoCode.code);

          // Then retrieve the coupon using the coupon ID. Stripe only returns
          // `applies_to` when it is expanded; without this the product
          // restriction check below never ran, so a code limited to one product
          // still discounted the lifetime charge computed further down.
          coupon = await stripe.coupons.retrieve(promoCode.coupon.id, { expand: ['applies_to'] });

          if (!coupon.valid) {
            return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
          }

          // Check custom coupon restrictions first
          if (!couponAllowsPrice(couponCode, priceId)) {
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

          if (plan === 'lifetime') {
            const limitError = await lifetimeCodeLimitError(promoCode, coupon, couponCode);
            if (limitError) {
              return NextResponse.json({ error: limitError }, { status: 400 });
            }
          }
        } catch (error) {
          console.error('Error validating coupon code:', error);
          return NextResponse.json({ error: 'Error validating coupon code' }, { status: 400 });
        }
      }

      const customer = await getOrCreateCustomer(uid, decodedToken.email);

      // One paid entitlement per account. Without this an existing subscriber
      // could start a second subscription and be charged twice, while only the
      // most recent id was stored (and therefore cancellable).
      if (await hasLiveEntitlement(uid, customer.id)) {
        return NextResponse.json(
          { error: 'You already have an active Helix Pro subscription' },
          { status: 409 }
        );
      }

      await cancelIncompleteSubscriptions(customer.id);

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
        // Calculate the payment amount, applying the validated coupon's discount
        let paymentAmount = LIFETIME_PRICE_CENTS;

        if (coupon?.percent_off) {
          paymentAmount = Math.round(paymentAmount * (1 - coupon.percent_off / 100));
        } else if (coupon?.amount_off) {
          paymentAmount = Math.max(0, paymentAmount - coupon.amount_off);
        }

        // Create a payment intent for one-time payment instead of subscription
        const paymentIntent = await stripe.paymentIntents.create(
          {
            amount: paymentAmount,
            currency: 'usd',
            customer: customer.id,
            payment_method: paymentMethodId,
            confirm: true,
            // A card that needs 3-D Secure comes back `requires_action`; this
            // lets the browser finish it with stripe.handleNextAction.
            use_stripe_sdk: true,
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

      if (promoCode) {
        subscriptionData.promotion_code = promoCode.id;
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

        await setProClaim(uid, true);

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

      // A declined card is for the customer to fix, and Stripe's message
      // says how ("Your card has insufficient funds.").
      if ((stripeError as { type?: string } | null)?.type === 'StripeCardError') {
        return NextResponse.json({ error: (stripeError as Error).message }, { status: 400 });
      }

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
