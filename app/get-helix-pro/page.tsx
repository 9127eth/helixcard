'use client';

import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Layout from '../components/Layout';
import StripePaymentForm from '../components/StripePaymentForm';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import Image from 'next/image';

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
    <Layout title="Get Helix Pro - HelixCard" showSidebar={true} transparentHeader={true} showHeader={false}>
      <Elements stripe={stripePromise}>
        {/* Hero Section - Solid blue background with dark text and decorative bottom edge */}
        <div className="relative overflow-hidden bg-[#7CCEDA] -mt-6">
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">
                Upgrade to Helix Pro
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto">
                Take your networking to the next level with powerful features designed for professionals.
              </p>
            </div>
          </div>
          
          {/* Decorative bottom edge - Wave pattern */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto" preserveAspectRatio="none">
              <path 
                fill="#f9fafb" 
                d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z">
              </path>
            </svg>
          </div>
        </div>
        
        {/* Plan Selection Section */}
        <div id="pricing-section" className="bg-gray-50 dark:bg-gray-900 py-16 -mt-2">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Choose the plan that's right for you</h2>
              
              {/* Plan Toggle - Updated to keep dark text when selected */}
              <div className="flex bg-gray-200 dark:bg-gray-800 rounded-full p-1.5 mb-12 shadow-inner">
                <button
                  className={`px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                    selectedPlan === 'lifetime'
                      ? 'bg-[#7CCEDA] text-gray-800 shadow-lg transform scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setSelectedPlan('lifetime')}
                >
                  Lifetime
                </button>
                <button
                  className={`px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                    selectedPlan === 'yearly'
                      ? 'bg-[#7CCEDA] text-gray-800 shadow-lg transform scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setSelectedPlan('yearly')}
                >
                  Yearly
                </button>
                <button
                  className={`px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                    selectedPlan === 'monthly'
                      ? 'bg-[#7CCEDA] text-gray-800 shadow-lg transform scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  Monthly
                </button>
              </div>
              
              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Free Plan Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 w-full border border-gray-200 dark:border-gray-700 flex flex-col justify-between h-full order-2 md:order-1 hover:shadow-2xl transition-shadow duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold">Free</h3>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">Basic</span>
                    </div>
                    <p className="text-3xl font-bold mb-6">${selectedPlan === 'monthly' ? '0/month' : '0/year'}</p>
                    <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-6"></div>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>1 free business card</span>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>Link to physical card via NFC</span>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>Add to Apple Wallet</span>
                      </li>
                      <li className="flex items-center text-gray-400">
                        <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        <span>AI powered business card scanning</span>
                      </li>
                      <li className="flex items-center text-gray-400">
                        <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        <span>Up to 10 business cards</span>
                      </li>
                      <li className="flex items-center text-gray-400">
                        <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        <span>CV/Resume Upload</span>
                      </li>
                    </ul>
                  </div>
                  <button className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-xl transition duration-200 hover:bg-gray-300 dark:hover:bg-gray-600">
                    Free
                  </button>
                </div>

                {/* Pro Plan Card */}
                <div className="bg-[#7CCEDA] rounded-3xl shadow-xl p-1 w-full order-1 md:order-2 transform hover:scale-105 transition-all duration-300">
                  <div className="bg-white dark:bg-gray-800 rounded-[28px] p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold">Pro</h3>
                        <span className="px-3 py-1 bg-[#7CCEDA] text-gray-800 rounded-full text-sm font-medium">Recommended</span>
                      </div>
                      <p className="text-3xl font-bold mb-2">{getPriceDisplay()}</p>
                      {selectedPlan === 'yearly' && (
                        <p className="text-sm text-[#7CCEDA] dark:text-[#7CCEDA] mb-4">Save 64% compared to monthly</p>
                      )}
                      {selectedPlan === 'lifetime' && (
                        <p className="text-sm text-[#7CCEDA] dark:text-[#7CCEDA] mb-4">Best value - one-time payment</p>
                      )}
                      <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-6"></div>
                      <ul className="space-y-4 mb-8">
                        <li className="flex items-center">
                          <svg className="w-5 h-5 text-[#7CCEDA] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span className="font-medium">AI powered business card scanning</span>
                        </li>
                        <li className="flex items-center">
                          <svg className="w-5 h-5 text-[#7CCEDA] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span className="font-medium">Up to 10 business cards</span>
                        </li>
                        <li className="flex items-center">
                          <svg className="w-5 h-5 text-[#7CCEDA] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span className="font-medium">CV/Resume Upload</span>
                        </li>
                        <li className="flex items-center">
                          <svg className="w-5 h-5 text-[#7CCEDA] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span className="font-medium">Link to physical card via NFC</span>
                        </li>
                        <li className="flex items-center">
                          <svg className="w-5 h-5 text-[#7CCEDA] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span className="font-medium">Add to Apple Wallet</span>
                        </li>
                        <li className="flex items-center">
                          <svg className="w-5 h-5 text-[#7CCEDA] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span className="font-medium">More features coming soon</span>
                        </li>
                      </ul>
                    </div>
                    {isLoading ? (
                      <LoadingSpinner fullScreen={false} />
                    ) : isSubscribed ? (
                      <button 
                        className="w-full bg-[#7CCEDA] text-white font-bold py-3 px-4 rounded-xl cursor-not-allowed opacity-70"
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
          </div>
        </div>
        
        {/* Testimonials Section */}
        <div className="bg-white dark:bg-gray-800 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">What our Pro users are saying</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 - Pharmacy Student */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-600 dark:text-green-300 font-bold">RJ</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Robert Johnson</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pharmacy Student</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">"The CV upload feature helped me stand out at ASHP Midyear. Love this app!"</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 dark:text-blue-300 font-bold">JD</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Brian Gomez</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sales Director</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">"The AI card scanning feature has saved our team hours of manual data entry. Worth every penny!"</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-4">
                    <span className="text-purple-600 dark:text-purple-300 font-bold">AS</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Alice Foster</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Freelance Designer</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">"I love being able to manage multiple business cards for different clients. The lifetime plan was a no-brainer!"</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold mb-2">Can I switch plans later?</h3>
                <p className="text-gray-600 dark:text-gray-300">Yes, you can upgrade or downgrade your plan at any time. If you switch to a lifetime plan, you'll never have to pay again.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold mb-2">How does the AI card scanning work?</h3>
                <p className="text-gray-600 dark:text-gray-300">Our AI technology automatically extracts contact information from business cards you scan, saving you time on manual data entry.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600 dark:text-gray-300">We accept all major credit cards through our secure payment processor, Stripe.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section - Solid blue with dark text */}
        <div className="bg-[#7CCEDA] py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Ready to upgrade your networking game?</h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">Join other professionals who are already using Helix Pro to make meaningful connections.</p>
            
            <a 
              href="#pricing-section"
              className="bg-white text-gray-800 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-gray-100 transition-colors duration-300 inline-block"
            >
              Get Helix Pro Now
            </a>
          </div>
        </div>
      </Elements>
    </Layout>
  );
};

export default GetHelixProPage;
