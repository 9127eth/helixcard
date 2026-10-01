import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, auth } from '@/app/lib/firebase-admin';
import { syncCardActiveStatus } from '@/app/lib/adminCards';
import { canonicalCouponCode } from '@/app/lib/coupons';
import { setProClaim } from '@/app/lib/proClaims';
import { PRICE_IDS, ProPlan, planForPriceId } from '@/app/lib/stripePrices';
import { FieldValue } from 'firebase-admin/firestore';
import type { DocumentData } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import { getGroupFromCoupon } from '@/app/utils/groupMapping';
import { recordCouponRedemption } from '@/app/utils/lifetimeCoupons';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Subscriptions that grant nothing yet but may still be paid. The newest one
 * stays recorded as the account's subscription so it can still be cancelled.
 */
const OPEN_SUBSCRIPTION_STATUSES = new Set<string>(['past_due', 'unpaid', 'incomplete', 'trialing']);

// Define interfaces for update data
interface SubscriptionUpdateData {
  isPro: boolean;
  isProType: ProPlan | FieldValue;
  subscriptionType: ProPlan | FieldValue;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string;
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean | FieldValue;
  currentPeriodEnd: Date | FieldValue;
  subscriptionUpdatedAt: Date;
  subscriptionCreatedAt?: Date;
  couponUsed?: string;
  group?: string;
}

interface PaymentIntentUpdateData {
  isPro: boolean;
  isProType: 'lifetime';
  subscriptionType: 'lifetime';
  lifetimePurchase: boolean;
  subscriptionUpdatedAt: Date;
  subscriptionCreatedAt?: Date;
  couponUsed?: string;
  group?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    if (!sig) {
      return NextResponse.json({ error: 'No Stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          // Stripe neither orders nor deduplicates deliveries, so the payload
          // only says which customer to look at; the entitlement comes from
          // the customer's subscriptions as they are now.
          const subscription = event.data.object as Stripe.Subscription;
          await handleCustomerChange(
            subscription.customer as string,
            subscription.metadata?.firebaseUID
          );
          break;
        }
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          // One-off invoices carry no entitlement.
          if (invoice.subscription && invoice.customer) {
            await handleCustomerChange(invoice.customer as string);
          }
          break;
        }
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentSucceeded(paymentIntent);
          break;
        case 'invoice.payment_failed':
          // Handle failed payment
          break;
        case 'customer.discount.created':
        case 'customer.discount.deleted':
        case 'customer.discount.updated':
          // Discount events acknowledged
          break;
        default:
          // Unhandled event type
          break;
      }
    } catch (err) {
      console.error(`Error processing webhook ${event.type}:`, err);
      return NextResponse.json(
        { error: 'Error processing webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Resolve the Firebase UID for a given Stripe customer using the same
 * three-step fallback in every webhook handler:
 *   1. Read from any metadata we already have (subscription or payment intent).
 *   2. Look it up on the Stripe customer object's metadata.
 *   3. Query Firestore by stripeCustomerId.
 *
 * Returns null if no match is found, so callers can log + bail out cleanly
 * instead of accidentally writing to `users/undefined`.
 */
async function resolveFirebaseUID(
  customerId: string,
  metadataUID?: string | null
): Promise<string | null> {
  if (metadataUID) return metadataUID;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted && customer.metadata?.firebaseUID) {
      return customer.metadata.firebaseUID;
    }
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
  }

  try {
    const userQuerySnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    if (!userQuerySnapshot.empty) {
      return userQuerySnapshot.docs[0].id;
    }
  } catch (error) {
    console.error('Error querying Firestore for stripeCustomerId:', error);
  }

  return null;
}

function isMissingStripeResource(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'resource_missing';
}

/** The customer's subscriptions, newest first. */
async function listSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    });
    return [...subscriptions.data].sort(
      (a: Stripe.Subscription, b: Stripe.Subscription) => b.created - a.created
    );
  } catch (error) {
    // A deleted customer has no subscriptions left to bill.
    if (isMissingStripeResource(error)) return [];
    throw error;
  }
}

function planOf(subscription: Stripe.Subscription): ProPlan | null {
  return planForPriceId(subscription.items?.data[0]?.price?.id);
}

/** The auth record for an account, or null when the account has been deleted. */
async function getAuthUser(uid: string): Promise<UserRecord | null> {
  try {
    return await auth.getUser(uid);
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'auth/user-not-found') return null;
    throw error;
  }
}

/**
 * Stop billing an account that no longer exists.
 *
 * The iOS app deletes accounts without calling /api/delete-account, so a web
 * subscription kept renewing after the account was gone. The event is still
 * acknowledged: Stripe retries a failed delivery for days, and no retry can
 * bring the account back.
 */
async function cancelBillingForDeletedAccount(uid: string, customerId: string | null) {
  const cancelledSubscriptionIds: string[] = [];
  if (customerId) {
    for (const subscription of await listSubscriptions(customerId)) {
      if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
        continue;
      }
      await stripe.subscriptions.cancel(subscription.id);
      cancelledSubscriptionIds.push(subscription.id);
    }
  }

  console.warn(
    `Stripe event for deleted account ${uid}: cancelled ${cancelledSubscriptionIds.length} ` +
    `subscription(s) on customer ${customerId}`
  );

  // Later deliveries find nothing left to cancel; writing then would replace
  // this record (or a completed /api/delete-account one) with an empty list.
  if (cancelledSubscriptionIds.length > 0) {
    await db.collection('accountDeletions').doc(uid).set({
      status: 'billing_cancelled_by_webhook',
      stripeCustomerId: customerId,
      cancelledSubscriptionIds,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
}

/**
 * The code a subscription was bought with, from its own promotion code.
 *
 * Looking codes up by coupon credited the newest code sharing that coupon, and
 * the customer's metadata named whatever was typed on the first checkout
 * attempt, which may not be the purchase that followed.
 */
async function promotionCodeOf(subscription: Stripe.Subscription): Promise<string | null> {
  const promotionCode = subscription.discount?.promotion_code;
  if (!promotionCode) return null;
  if (typeof promotionCode !== 'string') return canonicalCouponCode(promotionCode.code);

  try {
    return canonicalCouponCode((await stripe.promotionCodes.retrieve(promotionCode)).code);
  } catch (error) {
    console.error('Error retrieving promotion code:', error);
    return null;
  }
}

async function handleCustomerChange(customerId: string, metadataUID?: string | null) {
  const firebaseUID = await resolveFirebaseUID(customerId, metadataUID);

  if (!firebaseUID) {
    throw new Error(`No user found for Stripe customer: ${customerId}`);
  }

  await reconcileSubscriptions(firebaseUID, customerId);
}

/**
 * Derive the account's entitlement from the customer's current subscriptions.
 *
 * Every subscription and invoice event lands here, so a late or repeated
 * delivery rewrites the same state instead of replaying an old one.
 */
async function reconcileSubscriptions(firebaseUID: string, customerId: string) {
  if (!(await getAuthUser(firebaseUID))) {
    await cancelBillingForDeletedAccount(firebaseUID, customerId);
    return;
  }

  const subscriptions = await listSubscriptions(customerId);

  // Only an active subscription on one of our own prices grants Pro; anything
  // else used to fall back to monthly Pro. Log rather than throw: throwing
  // would make Stripe retry this event forever.
  for (const subscription of subscriptions) {
    if (subscription.status === 'active' && !planOf(subscription)) {
      console.error(
        `Not granting Pro for unrecognised Stripe price ${subscription.items?.data[0]?.price?.id} ` +
        `(customer ${customerId})`
      );
    }
  }
  const entitling = subscriptions.find(
    (subscription: Stripe.Subscription) => subscription.status === 'active' && planOf(subscription) !== null
  );
  const tracked = entitling ?? subscriptions.find(
    (subscription: Stripe.Subscription) => OPEN_SUBSCRIPTION_STATUSES.has(subscription.status)
  );
  const couponUsed = entitling ? await promotionCodeOf(entitling) : null;

  const userRef = db.collection('users').doc(firebaseUID);

  // Read and write in one transaction so a lifetime grant landing meanwhile
  // (payment_intent.succeeded) is seen rather than overwritten.
  const isPro = await db.runTransaction(async transaction => {
    const userSnapshot = await transaction.get(userRef);
    if (!userSnapshot.exists) return null;
    const userData = userSnapshot.data() ?? {};

    // A lifetime purchase is not a subscription; no subscription change may
    // lower it. App Store lifetime purchases recorded only isProType.
    const lifetime = userData.lifetimePurchase === true || userData.isProType === 'lifetime';
    const plan: ProPlan | null = lifetime ? 'lifetime' : entitling ? planOf(entitling) : null;

    const updateData: SubscriptionUpdateData = {
      isPro: plan !== null,
      isProType: plan ?? FieldValue.delete(),
      subscriptionType: plan ?? FieldValue.delete(),
      stripeSubscriptionId: tracked?.id ?? null,
      stripeCustomerId: customerId,
      subscriptionStatus: tracked?.status ?? subscriptions[0]?.status ?? 'canceled',
      cancelAtPeriodEnd: entitling ? entitling.cancel_at_period_end === true : FieldValue.delete(),
      currentPeriodEnd: entitling
        ? new Date(entitling.current_period_end * 1000)
        : FieldValue.delete(),
      subscriptionUpdatedAt: new Date(),
    };

    if (entitling && !lifetime && !userData.subscriptionCreatedAt) {
      updateData.subscriptionCreatedAt = new Date(entitling.created * 1000);
    }

    if (couponUsed) {
      updateData.couponUsed = couponUsed;
      const group = getGroupFromCoupon(couponUsed);
      if (group) {
        updateData.group = group;
      }
    }

    transaction.update(userRef, updateData as unknown as DocumentData);
    return updateData.isPro;
  });

  if (isPro === null) {
    console.error(`Ignoring Stripe event for ${firebaseUID}: the account has no users document`);
    return;
  }

  await setProClaim(firebaseUID, isPro);

  // Update card active statuses (Admin SDK — the previous helper used the
  // browser SDK, which cannot authenticate here and so never applied).
  await syncCardActiveStatus(firebaseUID);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Only handle lifetime subscription payments
  if (paymentIntent.metadata?.type !== 'lifetime') {
    return;
  }

  const firebaseUID = paymentIntent.metadata?.firebaseUID;
  if (!firebaseUID) {
    console.error('No Firebase UID found in payment intent metadata');
    return;
  }

  const customerId = typeof paymentIntent.customer === 'string'
    ? paymentIntent.customer
    : paymentIntent.customer?.id ?? null;
  const user = await getAuthUser(firebaseUID);
  if (!user) {
    await cancelBillingForDeletedAccount(firebaseUID, customerId);
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);
  const userSnapshot = await userRef.get();
  if (!userSnapshot.exists) {
    console.error(`Ignoring lifetime payment for ${firebaseUID}: the account has no users document`);
    return;
  }
  const userData = userSnapshot.data() ?? {};

  // Attribution comes from this payment alone. The customer's metadata named
  // the code typed on the first checkout attempt, which this purchase may not
  // have used.
  const couponUsed = paymentIntent.metadata?.couponCode
    ? canonicalCouponCode(paymentIntent.metadata.couponCode)
    : null;
  const group = couponUsed ? getGroupFromCoupon(couponUsed) : null;

  // Prepare update data
  const updateData: PaymentIntentUpdateData = {
    isPro: true,
    isProType: 'lifetime',
    subscriptionType: 'lifetime',
    lifetimePurchase: true,
    subscriptionUpdatedAt: new Date(),
  };

  if (!userData.subscriptionCreatedAt) {
    updateData.subscriptionCreatedAt = new Date(paymentIntent.created * 1000);
  }
  if (couponUsed) {
    updateData.couponUsed = couponUsed;
  }
  if (group) {
    updateData.group = group;
  }

  await userRef.update(updateData as unknown as { [key: string]: unknown });
  await setProClaim(firebaseUID, true);
  await syncCardActiveStatus(firebaseUID);

  // Idempotent: a redelivered event finds the record and writes nothing. The
  // auth record holds the email even where the users document does not
  // (accounts created in the iOS app).
  if (couponUsed) {
    await recordCouponRedemption(
      couponUsed,
      firebaseUID,
      user.email || userData.email || '',
      userData.name || user.displayName || '',
      paymentIntent.metadata?.priceId || PRICE_IDS.lifetime
    );
  }
}
