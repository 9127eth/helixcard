import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, auth } from '@/app/lib/firebase-admin';
import { syncCardActiveStatus } from '@/app/lib/adminCards';
import { planForPriceId } from '@/app/lib/stripePrices';
import { FieldValue } from 'firebase-admin/firestore';
import { getGroupFromCoupon } from '@/app/utils/groupMapping';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Define interfaces for update data
interface SubscriptionUpdateData {
  isPro: boolean;
  isProType?: 'monthly' | 'yearly' | 'lifetime' | FieldValue;
  subscriptionType?: 'monthly' | 'yearly' | 'lifetime' | FieldValue;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  subscriptionStatus: string;
  subscriptionUpdatedAt: Date;
  couponUsed?: string;
  group?: string;
}

interface PaymentIntentUpdateData {
  isPro: boolean;
  isProType: 'lifetime';
  subscriptionType: 'lifetime';
  lifetimePurchase: boolean;
  subscriptionUpdatedAt: Date;
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
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionChange(subscription);
          break;
        case 'customer.subscription.deleted':
          const canceledSubscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCancellation(canceledSubscription);
          break;
        case 'invoice.paid':
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
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

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  const firebaseUID = await resolveFirebaseUID(
    customerId,
    subscription.metadata?.firebaseUID
  );

  if (!firebaseUID) {
    throw new Error(
      `No user found for Stripe customer in handleSubscriptionChange: ${customerId}`
    );
  }

  // Resolve the plan from the price id. Anything that is not one of our own
  // prices grants nothing — this used to silently fall back to monthly Pro.
  const priceId = subscription.items.data[0]?.price.id;
  const subscriptionType = planForPriceId(priceId);

  if (status === 'active' && !subscriptionType) {
    // Log rather than throw: throwing would make Stripe retry this event
    // forever. The subscription is still recorded, just without an entitlement.
    console.error(
      `Not granting Pro for unrecognised Stripe price ${priceId} (customer ${customerId})`
    );
  }

  const isPro = status === 'active' && subscriptionType !== null;

  // Get coupon information for group assignment
  let group = null;
  let couponUsed = null;
  
  if (subscription.discount?.coupon) {
    try {
      const promotionCodes = await stripe.promotionCodes.list({
        coupon: subscription.discount.coupon.id,
        active: true,
      });
      
      if (promotionCodes.data.length > 0) {
        couponUsed = promotionCodes.data[0].code;
        group = getGroupFromCoupon(couponUsed);
      }
    } catch (error) {
      console.error('Error retrieving promotion code:', error);
    }
  } else {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.metadata?.couponCode) {
        couponUsed = customer.metadata.couponCode;
        group = getGroupFromCoupon(couponUsed);
      }
    } catch (error) {
      console.error('Error retrieving customer metadata:', error);
    }
  }

  // Prepare update data
  const updateData: SubscriptionUpdateData = {
    isPro,
    isProType: isPro && subscriptionType ? subscriptionType : FieldValue.delete(),
    subscriptionType: isPro && subscriptionType ? subscriptionType : FieldValue.delete(),
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    subscriptionStatus: status,
    subscriptionUpdatedAt: new Date(),
  };

  if (couponUsed) {
    updateData.couponUsed = couponUsed;
  }
  if (group) {
    updateData.group = group;
  }

  await db.collection('users').doc(firebaseUID).update(updateData as unknown as { [key: string]: unknown });

  // Update custom claims
  await auth.setCustomUserClaims(firebaseUID, { isPro });

  // Update card active statuses (Admin SDK — the previous helper used the
  // browser SDK, which cannot authenticate here and so never applied).
  await syncCardActiveStatus(firebaseUID, isPro);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  if (!customerId) {
    console.error('Invoice has no customer; skipping');
    return;
  }

  const firebaseUID = await resolveFirebaseUID(customerId);
  if (!firebaseUID) {
    throw new Error(
      `No user found for Stripe customer in handleInvoicePaid: ${customerId}`
    );
  }

  if (!invoice.subscription) return;

  // Any line billing one of our prices is enough; proration and credit lines
  // are not guaranteed to come first.
  const billsAKnownPlan = invoice.lines.data.some(
    (line: Stripe.InvoiceLineItem) => planForPriceId(line.price?.id) !== null
  );

  if (!billsAKnownPlan) {
    console.error(
      `Ignoring paid invoice with no recognised Stripe price (customer ${customerId})`
    );
    return;
  }

  await db.collection('users').doc(firebaseUID).update({
    isPro: true,
  });

  await auth.setCustomUserClaims(firebaseUID, { isPro: true });
  await syncCardActiveStatus(firebaseUID, true);
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const firebaseUID = await resolveFirebaseUID(
    customerId,
    subscription.metadata?.firebaseUID
  );
  if (!firebaseUID) {
    throw new Error(
      `No user found for Stripe customer in handleSubscriptionCancellation: ${customerId}`
    );
  }

  const userRef = db.collection('users').doc(firebaseUID);
  const userData = (await userRef.get()).data();

  // A lifetime purchase is not a subscription and must survive the
  // cancellation of any recurring plan.
  if (userData?.lifetimePurchase === true) {
    if (userData?.stripeSubscriptionId === subscription.id) {
      await userRef.update({ stripeSubscriptionId: null, subscriptionStatus: 'canceled' });
    }
    return;
  }

  // Cancellation used to revoke Pro from whatever id happened to be stored last.
  // Check Stripe for any other live subscription on this customer first.
  const remaining = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 100,
  });

  const stillActive = remaining.data.some(
    (item: Stripe.Subscription) => item.id !== subscription.id
  );

  await userRef.update({
    isPro: stillActive,
    subscriptionStatus: stillActive ? 'active' : 'canceled',
    subscriptionUpdatedAt: new Date(),
    ...(userData?.stripeSubscriptionId === subscription.id && !stillActive
      ? { stripeSubscriptionId: null }
      : {}),
  });

  await auth.setCustomUserClaims(firebaseUID, { isPro: stillActive });
  await syncCardActiveStatus(firebaseUID, stillActive);
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

  // Get coupon information for group assignment
  let group = null;
  let couponUsed = null;

  if (paymentIntent.metadata?.couponCode) {
    couponUsed = paymentIntent.metadata.couponCode;
    group = getGroupFromCoupon(couponUsed);
  }

  if (!couponUsed && paymentIntent.customer) {
    try {
      const customer = await stripe.customers.retrieve(paymentIntent.customer as string);
      if (customer.metadata?.couponCode) {
        couponUsed = customer.metadata.couponCode;
        group = getGroupFromCoupon(couponUsed);
      }
    } catch (error) {
      console.error('Error retrieving customer for payment intent:', error);
    }
  }

  // Prepare update data
  const updateData: PaymentIntentUpdateData = {
    isPro: true,
    isProType: 'lifetime',
    subscriptionType: 'lifetime',
    lifetimePurchase: true,
    subscriptionUpdatedAt: new Date(),
  };

  if (couponUsed) {
    updateData.couponUsed = couponUsed;
  }
  if (group) {
    updateData.group = group;
  }

  try {
    await db.collection('users').doc(firebaseUID).update(updateData as unknown as { [key: string]: unknown });
    await auth.setCustomUserClaims(firebaseUID, { isPro: true });
    await syncCardActiveStatus(firebaseUID, true);

    // Record coupon redemption if a coupon was used
    if (couponUsed) {
      try {
        const userDoc = await db.collection('users').doc(firebaseUID).get();
        const userData = userDoc.data();
        
        if (userData) {
          const { recordCouponRedemption } = await import('../../utils/lifetimeCoupons');
          await recordCouponRedemption(
            couponUsed,
            firebaseUID,
            userData.email || '',
            userData.name || '',
            paymentIntent.metadata?.priceId || 'price_1QKWqI2Mf4JwDdD1NaOiqhhg'
          );
        }
      } catch (redemptionError) {
        console.error('Error recording coupon redemption:', redemptionError);
      }
    }
  } catch (error) {
    console.error('Error updating user after payment intent succeeded:', error);
    throw error;
  }
}
