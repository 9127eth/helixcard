'use client';

import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '../context/ToastContext';

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
  const [isFreeWithCoupon, setIsFreeWithCoupon] = useState(false);
  const [isVMCRXCoupon, setIsVMCRXCoupon] = useState(false);
  const [isMCKiS25Coupon, setIsMCKiS25Coupon] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

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

    if (!user) {
      setErrorMessage('Please log in to continue.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setCouponMessage(null);

    try {
      const idToken = await user.getIdToken();
      const priceId = getPriceId();

      // Handle free VMCRX subscription without payment method
      if (isFreeWithCoupon && (isVMCRXCoupon || isMCKiS25Coupon)) {
        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId,
            idToken,
            couponCode: couponCode.trim(),
            isFreeSubscription: true
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create subscription');
        }

        // Refresh user token to get updated claims
        await user.getIdToken(true);

        showToast('Congratulations! Your free lifetime Helix Pro subscription is now active.', 'success');
        router.push('/dashboard?subscription=success');
        return;
      }

      // Regular payment flow for non-free subscriptions
      if (!stripe || !elements) {
        setErrorMessage('Payment system not initialized. Please try again.');
        return;
      }

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

      // Redact sensitive info in logs
      console.log('Created payment method:', '[REDACTED]');

      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          idToken,
          couponCode: couponCode.trim() || undefined,
          paymentMethodId: paymentMethod.id
        }),
      });

      const data = await response.json();
      // Redact sensitive info in logs
      console.log('Subscription response:', {
        ...data,
        clientSecret: data.clientSecret ? '[REDACTED]' : undefined,
        subscriptionId: data.subscriptionId ? '[REDACTED]' : undefined
      });

      if (!response.ok) {
        console.error('Subscription creation failed:', data);
        setErrorMessage(data.error || 'Failed to create subscription');
        return;
      }

      // Handle successful subscription creation
      if (data.subscriptionId || data.success) {
        // Refresh user claims
        await user.getIdToken(true);
        
        // Redirect to success page
        window.location.href = '/dashboard?success=true';
        return;
      }

      // Handle free subscription
      if (data.isFreeWithCard) {
        router.push('/dashboard?subscription=success');
        return;
      }

      // For paid subscriptions or one-time payments, confirm the payment
      if (!data.clientSecret) {
        throw new Error('No client secret returned');
      }

      // For lifetime plan, payment is already confirmed on the server
      if (selectedPlan === 'lifetime') {
        // Just check the payment status
        const { paymentIntent } = await stripe.retrievePaymentIntent(data.clientSecret);
        if (paymentIntent?.status !== 'succeeded') {
          throw new Error('Payment failed. Please try again.');
        }
      } else {
        // For subscription plans, confirm the payment
        const { error: paymentError } = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (paymentError) {
          throw handlePaymentError(paymentError);
        }
      }

      // Show success toast before redirecting
      showToast(
        `Payment successful! Your ${selectedPlan} subscription is now active.`, 
        'success'
      );

      router.push('/dashboard?subscription=success');
    } catch (error: unknown) {
      console.error('Payment error:', error);
      interface StripeError {
        type: string;
        message: string;
      }
      
      if (error && 
          typeof error === 'object' && 
          'type' in error &&
          'message' in error &&
          (error as StripeError).type === 'card_error' || 
          (error as StripeError).type === 'validation_error') {
        setErrorMessage((error as StripeError).message);
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
        setIsFreeWithCoupon(false);
        setIsVMCRXCoupon(false);
        setIsMCKiS25Coupon(false);
      } else {
        setCouponMessage('Coupon applied successfully!');
        setDiscountedAmount(data.discountedAmount);
        setIsFreeWithCoupon(data.isFree || data.isVMCRX || data.isMCKiS25);
        setIsVMCRXCoupon(data.isVMCRX);
        setIsMCKiS25Coupon(data.isMCKiS25);
      }
    } catch (error) {
      setCouponMessage('Error applying coupon');
      setDiscountedAmount(null);
      setIsFreeWithCoupon(false);
      setIsVMCRXCoupon(false);
      setIsMCKiS25Coupon(false);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Helper function to handle payment errors
  const handlePaymentError = (paymentError: { code?: string; message?: string }) => {
    switch (paymentError.code) {
      case 'card_declined':
        return new Error('Your card was declined. Please try another card.');
      case 'expired_card':
        return new Error('Your card has expired. Please try another card.');
      case 'incorrect_cvc':
        return new Error('Incorrect CVC code. Please check and try again.');
      case 'insufficient_funds':
        return new Error('Insufficient funds. Please try another card.');
      default:
        return new Error(paymentError.message || 'Payment failed. Please try again.');
    }
  };

  if (isSubscribed) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit}>
      {!isFreeWithCoupon && (
        <div className="mb-4">
          <CardElement className="p-3 border rounded-md" />
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="couponCode" className="block text-sm font-medium mb-1">
          Have a coupon code?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="couponCode"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);
              // Reset free coupon state when input is cleared
              if (!e.target.value.trim()) {
                setIsFreeWithCoupon(false);
                setIsVMCRXCoupon(false);
                setIsMCKiS25Coupon(false);
                setDiscountedAmount(null);
                setCouponMessage(null);
              }
            }}
            className="flex-1 w-full p-2 border rounded-md"
            placeholder="Enter coupon code"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={!couponCode.trim() || isApplyingCoupon}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !couponCode.trim() || isApplyingCoupon
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
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

      {isFreeWithCoupon && (isVMCRXCoupon || isMCKiS25Coupon) && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 font-medium">
            🎉 Congratulations! Your coupon code gives you free lifetime access to Helix Pro. No credit card required!
          </p>
        </div>
      )}

      {errorMessage && <div className="text-red-500 mt-2">{errorMessage}</div>}
      
      <button
        type="submit"
        disabled={(!stripe && !isFreeWithCoupon) || isLoading}
        className="w-full bg-blue-500 text-white dark:text-[#323338] font-bold py-2 px-4 rounded-[20px] mt-4 transition duration-200"
      >
        {isLoading
          ? 'Processing...'
          : isFreeWithCoupon && (isVMCRXCoupon || isMCKiS25Coupon)
          ? 'Claim Free Lifetime Access'
          : `Upgrade for $${((discountedAmount !== null ? discountedAmount : getPriceInCents()) / 100).toFixed(2)}`}
      </button>
    </form>
  );
};

export default StripePaymentForm;
