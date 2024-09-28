'use client';

import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Layout from '../components/Layout';
import StripePaymentForm from '../components/StripePaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const GetHelixProPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <Layout title="Get Helix Pro - HelixCard" showSidebar={true}>
      <Elements stripe={stripePromise}>
        <div className="flex flex-col items-center p-8">
          <h1 className="text-3xl font-bold mb-6">Choose the plan that is right for you.</h1>
          <div className="flex items-center space-x-4 mb-8">
            <span className={`text-lg ${!isYearly ? 'font-bold' : ''}`}>Monthly</span>
            <button
              className={`w-16 h-8 rounded-full p-1 ${
                isYearly ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => setIsYearly(!isYearly)}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transform duration-300 ease-in-out ${
                  isYearly ? 'translate-x-8' : ''
                }`}
              ></div>
            </button>
            <span className={`text-lg ${isYearly ? 'font-bold' : ''}`}>Yearly</span>
          </div>
          <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
            <div className="bg-white rounded-lg shadow-md p-8 w-full md:w-80 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4">Free</h2>
                <p className="text-gray-600 mb-6">${isYearly ? '0/year' : '0/month'}</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Up to 10 business cards
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Basic design templates
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Unlimited sharing
                  </li>
                  <li className="flex items-center text-gray-400">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    Custom branding
                  </li>
                  <li className="flex items-center text-gray-400">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    Analytics
                  </li>
                </ul>
              </div>
              <button className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200">
                Current Plan
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 w-full md:w-80 border-2 border-blue-500 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4">Pro</h2>
                <p className="text-gray-600 mb-6">${isYearly ? '12/year' : '3/month'}</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Unlimited business cards
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Advanced design templates
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Unlimited sharing
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Custom branding
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Analytics
                  </li>
                </ul>
              </div>
              <StripePaymentForm isYearly={isYearly} />
            </div>
          </div>
        </div>
      </Elements>
    </Layout>
  );
};

export default GetHelixProPage;