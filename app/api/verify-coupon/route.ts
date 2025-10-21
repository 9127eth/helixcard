import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Define a type for Stripe errors
interface StripeError extends Error {
  code?: string;
  type?: string;
  statusCode?: number;
}

// Define restricted coupon code mappings
const COUPON_RESTRICTIONS: Record<string, string[]> = {
  'LIPSCOMB25': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'UTTYLER25': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'VMCRX': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'NHMA25': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'MCKiS25': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'NCPA25': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'UCONN25': ['price_1QKWqI2Mf4JwDdD1NaOiqhhg'], // Lifetime
  'EMPRX25': ['price_1QEXRZ2Mf4JwDdD1pdam2mHo', 'price_1QEfJH2Mf4JwDdD1j2ME28Fw'], // Monthly & Yearly
}

export async function POST(req: Request) {
  try {
    const { couponCode, priceId, idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the Firebase ID token
    await auth.verifyIdToken(idToken);

    try {
      // Check if coupon has product restrictions
      if (COUPON_RESTRICTIONS[couponCode] && !COUPON_RESTRICTIONS[couponCode].includes(priceId)) {
        return NextResponse.json({ 
          error: 'This coupon code is not valid for the selected product type' 
        }, { status: 400 });
      }

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

      // Get the price to calculate the discount
      const price = await stripe.prices.retrieve(priceId);
      const originalAmount = price.unit_amount || 0;

      // Calculate discounted amount
      let discountedAmount = originalAmount;
      if (coupon.percent_off) {
        discountedAmount = Math.round(originalAmount * (1 - coupon.percent_off / 100));
      } else if (coupon.amount_off) {
        discountedAmount = Math.max(0, originalAmount - coupon.amount_off);
      }

      return NextResponse.json({
        discountedAmount,
        message: 'Coupon applied successfully',
        isFree: discountedAmount === 0,
        isVMCRX: couponCode === 'VMCRX',
        isMCKiS25: couponCode === 'MCKiS25',
        isNCPA25: couponCode === 'NCPA25'
      });
    } catch (error) {
      const stripeError = error as StripeError;
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error verifying coupon:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
