'use client';

import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

interface StripePaymentFormProps {
  selectedPlan: 'monthly' | 'yearly' | 'lifetime';
  isSubscribed?: boolean;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ selectedPlan, isSubscribed = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discountedAmount, setDiscountedAmount] = useState<number | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const router = useRouter();

  const getPriceId = () => {
    switch (selectedPlan) {
      case 'monthly':
        return 'price_1QEXRZ2Mf4JwDdD1pdam2mHo';
      case 'yearly':
        return 'price_1QEfJH2Mf4JwDdD1j2ME28Fw';
      case 'lifetime':
        return 'price_1QKWqI2Mf4JwDdD1NaOiqhhg';
      default:
        return '';
    }
  };

  const getPriceDisplay = () => {
    switch (selectedPlan) {
      case 'monthly':
        return '$2.99';
      case 'yearly':
        return '$12.99';
      case 'lifetime':
        return '$19.99';
      default:
        return '';
    }
  };

  const getPriceInCents = () => {
    switch (selectedPlan) {
      case 'monthly':
        return 299;
      case 'yearly':
        return 1299;
      case 'lifetime':
        return 1999;
      default:
        return 0;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      setErrorMessage('Payment system not initialized. Please try again.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setCouponMessage(null);

    try {
      // First validate the card
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create a payment method first
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        throw paymentMethodError;
      }

      console.log('Created payment method:', paymentMethod.id);

      const idToken = await user.getIdToken();
      const priceId = getPriceId();

      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          idToken,
          isLifetime: selectedPlan === 'lifetime',
          couponCode: couponCode.trim() || undefined,
          paymentMethodId: paymentMethod.id
        }),
      });

      const data = await response.json();
      console.log('Subscription response:', data);

      if (!response.ok) {
        console.error('Subscription creation failed:', data);
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Handle free subscription
      if (data.isFreeWithCard) {
        router.push('/dashboard?subscription=success');
        return;
      }

      // For paid subscriptions, confirm the payment
      if (!data.clientSecret) {
        throw new Error('No client secret returned');
      }

      const { error: paymentError } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (paymentError) {
        switch (paymentError.code) {
          case 'card_declined':
            throw new Error('Your card was declined. Please try another card.');
          case 'expired_card':
            throw new Error('Your card has expired. Please try another card.');
          case 'incorrect_cvc':
            throw new Error('Incorrect CVC code. Please check and try again.');
          case 'insufficient_funds':
            throw new Error('Insufficient funds. Please try another card.');
          default:
            throw new Error(paymentError.message || 'Payment failed. Please try again.');
        }
      }

      router.push('/dashboard?subscription=success');
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error && (error.type === 'card_error' || error.type === 'validation_error')) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !user) return;

    setIsApplyingCoupon(true);
    setErrorMessage(null);
    setCouponMessage(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/verify-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          priceId: getPriceId(),
          idToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCouponMessage(data.error || 'Invalid coupon code');
        setDiscountedAmount(null);
      } else {
        setCouponMessage('Coupon applied successfully!');
        setDiscountedAmount(data.discountedAmount);
      }
    } catch (error) {
      setCouponMessage('Error applying coupon');
      setDiscountedAmount(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  if (isSubscribed) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <CardElement className="p-3 border rounded-md" />
      </div>
      
      <div className="mb-4">
        <label htmlFor="couponCode" className="block text-sm font-medium mb-1">
          Have a coupon code?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="couponCode"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1 w-full p-2 border rounded-md"
            placeholder="Enter coupon code"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={!couponCode.trim() || isApplyingCoupon}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplyingCoupon ? 'Applying...' : 'Apply'}
          </button>
        </div>
        {couponMessage && (
          <p className={`text-sm mt-1 ${couponMessage.includes('Invalid') ? 'text-red-500' : 'text-green-500'}`}>
            {couponMessage}
          </p>
        )}
      </div>

      {errorMessage && <div className="text-red-500 mt-2">{errorMessage}</div>}
      
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-blue-500 text-white dark:text-[#323338] font-bold py-2 px-4 rounded-[20px] mt-4 transition duration-200"
      >
        {isLoading
          ? 'Processing...'
          : `Upgrade for $${((discountedAmount !== null ? discountedAmount : getPriceInCents()) / 100).toFixed(2)}`}
      </button>
    </form>
  );
};

export default StripePaymentForm;
