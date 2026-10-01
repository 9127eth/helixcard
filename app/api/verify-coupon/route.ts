import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '../../lib/firebase-admin';
import { canonicalCouponCode, couponAllowsPrice, findTrackingOnlyCoupon } from '../../lib/coupons';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Define a type for Stripe errors
interface StripeError extends Error {
  code?: string;
  type?: string;
  statusCode?: number;
}

export async function POST(req: Request) {
  try {
    const { couponCode: rawCouponCode, priceId, idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the Firebase ID token
    await auth.verifyIdToken(idToken);

    const typedCode = typeof rawCouponCode === 'string' ? rawCouponCode.trim() : '';
    if (!typedCode) {
      return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
    }

    try {
      // Tracking-only codes attribute the purchase without changing the price
      const trackingOnlyCode = findTrackingOnlyCoupon(typedCode);
      if (trackingOnlyCode) {
        if (!couponAllowsPrice(trackingOnlyCode, priceId)) {
          return NextResponse.json({
            error: 'This coupon code is not valid for the selected product type'
          }, { status: 400 });
        }

        const price = await stripe.prices.retrieve(priceId);
        const originalAmount = price.unit_amount || 0;

        return NextResponse.json({
          discountedAmount: originalAmount,
          message: 'Code applied successfully',
          isFree: false,
          isTrackingOnly: true,
          isVMCRX: false,
          isMCKiS25: false,
          isNCPA25: false
        });
      }

      // First, retrieve the promotion code
      const promotionCodes = await stripe.promotionCodes.list({
        code: typedCode,
        active: true,
      });

      if (promotionCodes.data.length === 0) {
        return NextResponse.json({ error: 'Invalid promotion code' }, { status: 400 });
      }

      const promoCode = promotionCodes.data[0];
      // Stripe matched the code ignoring case; the restriction and partner
      // tables need its canonical spelling.
      const couponCode = canonicalCouponCode(promoCode.code);

      // Check if coupon has product restrictions
      if (!couponAllowsPrice(couponCode, priceId)) {
        return NextResponse.json({
          error: 'This coupon code is not valid for the selected product type'
        }, { status: 400 });
      }

      // Then retrieve the coupon using the coupon ID
      const coupon = await stripe.coupons.retrieve(promoCode.coupon.id);

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
