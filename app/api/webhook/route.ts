import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, auth } from '@/app/lib/firebase-admin';
import { updateCardActiveStatus } from '@/app/lib/firebaseOperations';
import { deleteField, FieldValue } from 'firebase/firestore';
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

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  // First try to get Firebase UID from subscription metadata
  let firebaseUID = subscription.metadata?.firebaseUID;
  
  if (!firebaseUID) {
    // Fallback: get customer and check metadata
    try {
      const customer = await stripe.customers.retrieve(customerId);
      firebaseUID = customer.metadata?.firebaseUID;
    } catch (error) {
      console.error('Error retrieving customer:', error);
    }
  }

  if (!firebaseUID) {
    // Final fallback: query Firestore
    const userQuerySnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (userQuerySnapshot.empty) {
      console.error('No user found for Stripe customer');
      return;
    }

    firebaseUID = userQuerySnapshot.docs[0].id;
  }

  const isPro = status === 'active';
  
  // Determine subscription type based on price ID
  let subscriptionType = 'monthly'; // default
  if (subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;
    if (priceId === 'price_1QKWqI2Mf4JwDdD1NaOiqhhg') {
      subscriptionType = 'lifetime';
    } else if (priceId === 'price_1QEfJH2Mf4JwDdD1j2ME28Fw') {
      subscriptionType = 'yearly';
    }
  }

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
    isProType: isPro ? (subscriptionType as 'monthly' | 'yearly' | 'lifetime') : deleteField(),
    subscriptionType: isPro ? (subscriptionType as 'monthly' | 'yearly' | 'lifetime') : deleteField(),
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

  // Update card active statuses
  await updateCardActiveStatus(firebaseUID, isPro);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customerData = await stripe.customers.retrieve(customerId);
  const firebaseUID = customerData.metadata.firebaseUID;

  if (invoice.subscription) {
    await db.collection('users').doc(firebaseUID).update({
      isPro: true,
    });

    await auth.setCustomUserClaims(firebaseUID, { isPro: true });
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const userQuerySnapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (userQuerySnapshot.empty) {
    console.error('No user found for cancelled subscription');
    return;
  }

  const userDoc = userQuerySnapshot.docs[0];
  const uid = userDoc.id;

  await db.collection('users').doc(uid).update({
    isPro: false,
    stripeSubscriptionId: null,
  });

  await auth.setCustomUserClaims(uid, { isPro: false });
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
  }
}
