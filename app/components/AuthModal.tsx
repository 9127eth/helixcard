'use client';

import React, { useState } from 'react';
import { RegisterForm } from './RegisterForm';
import { LoginForm } from './LoginForm';
import { useAuth } from '../hooks/useAuth';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import dynamic from 'next/dynamic';
import { createUserDocument } from '../lib/firebaseOperations';
import { FaApple } from 'react-icons/fa';
import { getDeviceInfo } from '../utils/deviceDetection';

const ClientCardCreator = dynamic(() => import('./ClientCardCreator'), { ssr: false });

export const AuthModal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
  };

  const handleSuccess = () => {
    // No need to redirect, the home page will handle it
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      if (!auth) {
        throw new Error('Auth instance is not initialized');
      }

      const result = await signInWithPopup(auth, provider);

      // Get device info
      const deviceInfo = getDeviceInfo();

      // Create user document with device info
      await createUserDocument(result.user, deviceInfo);

      handleSuccess();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const provider = new OAuthProvider('apple.com');
      if (!auth) {
        throw new Error('Auth instance is not initialized');
      }

      const result = await signInWithPopup(auth, provider);

      // Get device info
      const deviceInfo = getDeviceInfo();

      // Create user document with device info
      await createUserDocument(result.user, deviceInfo);

      handleSuccess();
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      setError('Failed to sign in with Apple. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
  };

  const handleCancelForgotPassword = () => {
    setIsForgotPassword(false);
  };

  if (user) {
    return (
      <div className="animate-fadeIn">
        <ClientCardCreator user={user} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 p-8 pt-10 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md min-h-[500px] relative overflow-hidden animate-fadeIn">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700/30 dark:to-gray-800/20 rounded-bl-full -z-10 opacity-70 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gray-100 to-gray-50 dark:from-gray-700/30 dark:to-gray-800/20 rounded-tr-full -z-10 opacity-70 animate-pulse-slow"></div>
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-gray-50/50 to-transparent dark:from-gray-700/10 dark:to-transparent rounded-full -z-10"></div>
      
      {/* Login/Signup toggle button at top right - only show on signup page */}
      {!isLogin && !isForgotPassword && (
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleAuthMode}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 border border-gray-200 rounded-xl shadow-sm transition-all duration-200"
          >
            Log in
          </button>
        </div>
      )}
      
      <h4 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        {isForgotPassword ? 'Reset Password' : isLogin ? 'Log in' : 'Sign up'}
      </h4>

      {isLogin && !isForgotPassword && (
        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-6">
          Welcome back! 👋
        </p>
      )}

      <div className="flex flex-col flex-1">
        {!isForgotPassword && (
          <>
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 mb-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Continue with Google
            </button>
            <button
              onClick={handleAppleSignIn}
              className="w-full py-3 px-4 mb-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 group"
            >
              <FaApple className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Continue with Apple
            </button>
          </>
        )}
        {!isForgotPassword && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 py-1 text-sm text-gray-500 dark:text-gray-400 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 rounded-full">Or</span>
            </div>
          </div>
        )}
        <div className="mb-6">
          {isForgotPassword ? (
            <ForgotPasswordForm onCancel={handleCancelForgotPassword} onBackToSignIn={handleCancelForgotPassword} />
          ) : isLogin ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}
        </div>
      </div>

      {/* "Don't have an account? Sign up" section - only show on login page */}
      {isLogin && !isForgotPassword && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?
          </p>
          <button
            onClick={toggleAuthMode}
            className="mt-2 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors hover:underline"
          >
            Sign up
          </button>
        </div>
      )}

      {isLogin && !isForgotPassword && (
        <div className="mt-4 text-right">
          <button
            onClick={handleForgotPassword}
            className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors hover:underline"
          >
            Forgot password?
          </button>
        </div>
      )}
      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/30">
          <p className="text-red-600 dark:text-red-400 text-center text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
