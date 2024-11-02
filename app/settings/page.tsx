'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import DeleteAccountButton from '../components/DeleteAccountButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Mail, CreditCard, Settings as SettingsIcon, AlertTriangle } from 'react-feather';

interface SubscriptionData {
  isPro: boolean;
  isYearly: boolean;
}

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    isPro: false,
    isYearly: false
  });

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (user && db) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setSubscriptionData({
          isPro: userData?.isPro || false,
          isYearly: userData?.isYearly || false
        });
      }
    };

    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    fetchSubscriptionData().finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode ? 'true' : 'false');
  };

  const getSubscriptionText = () => {
    if (!subscriptionData.isPro) return 'Free Plan';
    return `Helix Pro - ${subscriptionData.isYearly ? 'Yearly' : 'Monthly'}`;
  };

  const handleCancelSubscription = async () => {
    if (!user || !window.confirm('Are you sure you want to cancel your subscription? Your Pro features will remain active until the end of your billing period.')) {
      return;
    }

    try {
      setIsCancelling(true);
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

      setSubscriptionData(prev => ({
        ...prev,
        isPro: false,
        isYearly: false
      }));
      
      alert('Subscription cancelled successfully. Your account will remain Pro until the end of the current billing period.');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  return (
    <Layout title="Settings - HelixCard" showSidebar={true}>
      <div className="p-6 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">Manage your account settings and preferences.</p>

        <div className="space-y-6">
          {/* Account Section */}
          <div className="bg-white dark:bg-[#2c2d31] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Account</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Manage your account details and authentication
            </p>
            
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link 
                href="#" 
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Change Email Address
              </Link>
              <Link 
                href="#" 
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Change Password
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-red-600 rounded-md border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-white dark:bg-[#2c2d31] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Subscription</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Manage your subscription and billing
            </p>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current plan</label>
              <p className="text-gray-600 dark:text-gray-400">{getSubscriptionText()}</p>
            </div>

            {subscriptionData.isPro && (
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="px-4 py-2 text-sm font-medium text-red-600 rounded-md border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel subscription'}
              </button>
            )}
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-[#2c2d31] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <SettingsIcon className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Preferences</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Customize your experience
            </p>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform transition ease-in-out duration-200 ${
                    isDarkMode ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white'
                  } rounded-full`}
                />
              </button>
            </div>
          </div>

          {/* Danger Zone Section */}
          <div className="bg-white dark:bg-[#2c2d31] rounded-lg p-6 shadow-sm border border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Irreversible and destructive actions
            </p>
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
