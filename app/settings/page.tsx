'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DeleteAccountButton from '../components/DeleteAccountButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, CreditCard, Settings as SettingsIcon, AlertTriangle, Mail } from 'react-feather';
import { FaApple } from 'react-icons/fa';
import { ChangeEmailForm } from '../components/ChangeEmailForm';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { sendEmailVerification } from 'firebase/auth';
import { User as FirebaseUser } from 'firebase/auth';

interface SubscriptionData {
  isPro: boolean;
  isYearly: boolean;
}

interface AuthProviderInfo {
  providerId: string;
  icon: React.ReactNode;
  label: string;
}

const EmailVerificationWarning: React.FC<{ user: FirebaseUser | null }> = ({ user }) => {
  const [isSending, setIsSending] = useState(false);

  const handleResendVerification = async () => {
    if (!user) return;
    
    try {
      setIsSending(true);
      await sendEmailVerification(user);
      alert('Verification email sent successfully. Please check your inbox.');
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('Failed to send verification email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!user || user.emailVerified || user.providerData[0]?.providerId !== 'password') {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
        <span className="text-sm text-yellow-800 dark:text-yellow-200">
          Please verify your email address
        </span>
        <button
          onClick={handleResendVerification}
          disabled={isSending}
          className="ml-auto text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
        >
          {isSending ? 'Sending...' : 'Resend verification email'}
        </button>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    isPro: false,
    isYearly: false
  });
  const [authProvider, setAuthProvider] = useState<AuthProviderInfo>({
    providerId: 'password',
    icon: <Mail className="w-5 h-5" />,
    label: 'Email'
  });
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user && db) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setSubscriptionData({
          isPro: userData?.isPro || false,
          isYearly: userData?.isYearly || false
        });

        const provider = user.providerData[0]?.providerId;
        let providerInfo: AuthProviderInfo;
        
        switch (provider) {
          case 'google.com':
            providerInfo = { providerId: provider, icon: (
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
            ), label: 'Google' };
            break;
          case 'apple.com':
            providerInfo = { providerId: provider, icon: <FaApple className="w-5 h-5" />, label: 'Apple' };
            break;
          case 'password':
            providerInfo = { providerId: provider, icon: <Mail className="w-5 h-5" />, label: 'Email' };
            break;
          default:
            providerInfo = { providerId: 'unknown', icon: <Mail className="w-5 h-5" />, label: 'Email' };
        }
        
        setAuthProvider(providerInfo);
      }
    };

    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    fetchData().finally(() => setIsLoading(false));
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
            
            <EmailVerificationWarning user={user} />

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Signed in with</label>
              <div className="flex items-center gap-2 mt-1">
                {authProvider.icon}
                <span className="text-gray-600 dark:text-gray-400">{authProvider.label}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {authProvider.providerId === 'password' && (
                <>
                  <button 
                    onClick={() => setShowEmailForm(true)}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Change Email Address
                  </button>
                  <button 
                    onClick={() => setShowPasswordForm(true)}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Change Password
                  </button>
                </>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Modal for Email Change */}
          {showEmailForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Change Email Address</h2>
                <ChangeEmailForm onClose={() => setShowEmailForm(false)} />
              </div>
            </div>
          )}

          {/* Modal for Password Change */}
          {showPasswordForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                <ChangePasswordForm onClose={() => setShowPasswordForm(false)} />
              </div>
            </div>
          )}

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
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
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
