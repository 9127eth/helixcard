'use client';

import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Layout from '../components/Layout';
import StripePaymentForm from '../components/StripePaymentForm';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const GetHelixProPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('lifetime');
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const idToken = await user.getIdToken();
          const response = await fetch('/api/verify-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });
          const data = await response.json();
          setIsSubscribed(data.success);
        } catch (error) {
          console.error('Error checking subscription:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  const getPriceDisplay = () => {
    switch (selectedPlan) {
      case 'monthly':
        return '$2.99/month';
      case 'yearly':
        return '$12.99/year';
      case 'lifetime':
        return (
          <span>
            $19.99 - pay once, get Helix Pro <strong>forever</strong>!
          </span>
        );
      default:
        return '';
    }
  };

  return (
    <Layout title="Get Helix Pro - HelixCard" showSidebar={true}>
      <Elements stripe={stripePromise}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center p-8">
            <h1 className="text-4xl font-bold mb-6">Choose the plan that is right for you.</h1>
            
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 mb-8">
              <button
                className={`px-6 py-2 rounded-[20px] transition-all duration-200 ${
                  selectedPlan === 'lifetime'
                    ? 'bg-white dark:bg-gray-700 shadow-sm border-2 border-gray-300 dark:border-gray-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                onClick={() => setSelectedPlan('lifetime')}
              >
                Lifetime
              </button>
              <button
                className={`px-6 py-2 rounded-[20px] transition-all duration-200 ${
                  selectedPlan === 'yearly'
                    ? 'bg-white dark:bg-gray-700 shadow-sm border-2 border-gray-300 dark:border-gray-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                onClick={() => setSelectedPlan('yearly')}
              >
                Yearly
              </button>
              <button
                className={`px-6 py-2 rounded-[20px] transition-all duration-200 ${
                  selectedPlan === 'monthly'
                    ? 'bg-white dark:bg-gray-700 shadow-sm border-2 border-gray-300 dark:border-gray-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                Monthly
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
              <div className="bg-white dark:bg-[#2c2d31] rounded-[30px] shadow-md p-8 w-full border-2 border-gray-500 flex flex-col justify-between h-full order-2 md:order-1">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Free</h2>
                  <p className="text-gray-500 mb-6">${selectedPlan === 'monthly' ? '0/month' : '0/year'}</p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      1 free business card
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Link to physical card via NFC
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Image upload
                    </li>
                    <li className="flex items-center text-gray-400">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      AI powered business card scanning
                    </li>
                    <li className="flex items-center text-gray-400">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      Up to 10 business cards
                    </li>
                    <li className="flex items-center text-gray-400">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      CV/Resume Upload
                    </li>
                  </ul>
                </div>
                <button className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200">
                  Free
                </button>
              </div>

              <div className="bg-white dark:bg-[#2c2d31] rounded-[30px] shadow-md p-8 w-full border-2 border-gray-500 flex flex-col justify-between h-full order-1 md:order-2">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Pro</h2>
                  <p className="text-gray-500 mb-6">{getPriceDisplay()}</p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      AI powered business card scanning
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Up to 10 business cards
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      CV/Resume Upload
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Link to physical card via NFC
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Image upload
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      More features coming soon
                    </li>
                  </ul>
                </div>
                {isLoading ? (
                  <LoadingSpinner fullScreen={false} />
                ) : isSubscribed ? (
                  <button 
                    className="w-full bg-primary text-black font-bold py-2 px-4 rounded-lg cursor-not-allowed opacity-70"
                    disabled
                  >
                    Current Plan
                  </button>
                ) : (
                  <StripePaymentForm selectedPlan={selectedPlan} isSubscribed={isSubscribed} />
                )}
              </div>
            </div>
          </div>
        </div>
      </Elements>
    </Layout>
  );
};

export default GetHelixProPage;
