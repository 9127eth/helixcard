'use client';

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import { AuthModal } from '../components/AuthModal';
import DashboardPage from '../dashboard/page';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DiscountPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <DashboardPage />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-[#F5FDFD] to-white dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">
              Redeem Your <span className="text-[#7CCEDA]">Discount Code</span>
            </h1>
            
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Left Column - Instructions */}
              <div className="w-full lg:w-1/2 mb-8 lg:mb-0">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">How to Redeem Your Discount</h2>
                  
                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-[#7CCEDA] rounded-full flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">Create your account first</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Sign up for a free Helix account (you don&apos;t need to create a card yet)
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-[#7CCEDA] rounded-full flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">Visit Get Helix Pro page</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Click the &quot;Get Helix Pro&quot; tab in the menu or go directly to helixcard.app/get-helix-pro
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-[#7CCEDA] rounded-full flex items-center justify-center text-white font-bold">
                        3
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">Select Lifetime plan</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Make sure to select the correct plan option (the discount only applies to a specific plan)
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 4 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-[#7CCEDA] rounded-full flex items-center justify-center text-white font-bold">
                        4
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">Enter the code</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Find the &quot;Coupon Code&quot; field and enter your code
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                    <p className="text-gray-800 dark:text-white font-medium">
                      <span className="font-bold">Important:</span> You must visit helixcard.app/get-helix-pro to redeem the code, not the app. Use the same login method you used to create your account if you already created an account from the app.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Auth Modal */}
              <div className="w-full lg:w-1/2 flex items-center justify-center">
                <div className="w-full max-w-md">
                  <AuthModal />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 