'use client';

import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Layout from '../components/Layout';
import StripePaymentForm from '../components/StripePaymentForm';
import { useAuth } from '../hooks/useAuth';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const GetHelixProPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
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

  const handleCancelSubscription = async () => {
    if (!user) {
      alert('You must be logged in to cancel your subscription.');
      return;
    }

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      alert('Subscription cancelled successfully. Your account will remain Pro until the end of the current billing period.');
      
      // Update local state
      setIsSubscribed(false);
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <Layout title="Get Helix Pro - HelixCard" showSidebar={true}>
      <Elements stripe={stripePromise}>
        <div className="flex flex-col items-center p-8">
          <h1 className="text-3xl font-bold mb-6">Choose the plan that is right for you.</h1>
          <div className="flex items-center space-x-4 mb-8">
            <span className={`text-lg ${!isYearly ? 'font-bold' : ''}`}>Monthly</span>
            <button
              className={`w-14 h-6 rounded-full p-0.5 ${
                isYearly ? 'bg-gray-600' : 'bg-gray-300'
              }`}
              onClick={() => setIsYearly(!isYearly)}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transform duration-300 ease-in-out ${
                  isYearly ? 'translate-x-8' : ''
                }`}
              ></div>
            </button>
            <span className={`text-lg ${isYearly ? 'font-bold' : ''}`}>Yearly</span>
          </div>
          <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
            <div className="bg-white dark:bg-[#2c2d31] rounded-[30px] shadow-md p-8 w-full md:w-80 border-2 border-gray-500 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4">Free</h2>
                <p className="text-gray-500 mb-6">${isYearly ? '0/year' : '0/month'}</p>
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

            <div className="bg-white dark:bg-[#2c2d31] rounded-[30px] shadow-md p-8 w-full md:w-80 border-2 border-gray-500 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4">Pro</h2>
                <p className="text-gray-500 mb-6">${isYearly ? '12.99/year' : '2.99/month'}</p>
                <ul className="space-y-2 mb-6">
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
                <div>Loading...</div>
              ) : isSubscribed ? (
                <button 
                  className="w-full bg-primary text-black font-bold py-2 px-4 rounded-lg cursor-not-allowed opacity-70"
                  disabled
                >
                  Current Plan
                </button>
              ) : (
                <StripePaymentForm isYearly={isYearly} />
              )}
            </div>
          </div>
          <button
            onClick={handleCancelSubscription}
            className="mt-8 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200"
          >
            Cancel Subscription
          </button>
        </div>
      </Elements>
    </Layout>
  );
};

export default GetHelixProPage;
