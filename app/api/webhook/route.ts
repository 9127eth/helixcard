import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, auth } from '@/app/lib/firebase-admin';  // Add auth here

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    case 'invoice.paid':
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
      break;
    case 'invoice.payment_failed':
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  // Find the Firebase user with the matching Stripe customer ID
  const userRecord = await auth.listUsers().then(listUsersResult => 
    listUsersResult.users.find(user => 
      user.customClaims?.stripeCustomerId === customerId
    )
  );

  if (!userRecord) {
    console.error(`No user found for Stripe customer ID: ${customerId}`);
    return;
  }

  await db.collection('users').doc(userRecord.uid).update({
    isPro: status === 'active',
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customerData = await stripe.customers.retrieve(customerId);
  const firebaseUID = customerData.metadata.firebaseUID;

  if (invoice.subscription) {
    await db.collection('users').doc(firebaseUID).update({
      isPro: true,
    });
  }
}
