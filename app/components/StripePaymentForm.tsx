'use client';

import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

interface StripePaymentFormProps {
  isYearly: boolean;
  isSubscribed?: boolean; // Make this prop optional
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ isYearly, isSubscribed = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: isYearly ? 'price_1QEfJH2Mf4JwDdD1j2ME28Fw' : 'price_1QEXRZ2Mf4JwDdD1pdam2mHo',
          idToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const { clientSecret } = await response.json();

      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {errorMessage && <div className="text-red-500 mt-2">{errorMessage}</div>}
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-blue-500 text-white dark:text-[#323338] font-bold py-2 px-4 rounded-lg mt-4 transition duration-200"
      >
        {isLoading ? 'Processing...' : `Pay $${isYearly ? '12' : '3'}`}
      </button>
    </form>
  );
};

export default StripePaymentForm;