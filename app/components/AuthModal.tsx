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
    console.log('Authentication successful');
    // No need to redirect, the home page will handle it
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      if (!auth) {
        throw new Error('Auth instance is not initialized');
      }

      console.log('Attempting Google Sign-In with Popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('Google Sign-In successful:', result.user.uid);

      // Call createUserDocument to create the user document in Firestore
      await createUserDocument(result.user);

      handleSuccess();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const provider = new OAuthProvider('apple.com');
      if (!auth) {
        throw new Error('Auth instance is not initialized');
      }

      console.log('Attempting Apple Sign-In with Popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('Apple Sign-In successful:', result.user.uid);

      // Call createUserDocument to create the user document in Firestore
      await createUserDocument(result.user);

      handleSuccess();
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
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
      <div>
        <ClientCardCreator user={user} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
      <h4 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">
        {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
      </h4>
      {!isForgotPassword && (
        <>
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
            className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
              <path d="M294.29,0.32l28.57,0.63c22.42,0.5,57.62,2.74,100.72,13.51,74.18,18.48,137.27,58.25,184.83,97.21,27.58,22.62,49.64,44.71,70.28,70.98,24.33,30.92,45.05,71.87,53.96,119.31,3.86,20.52,5.39,39.97,6.05,57.02,0.09,2.23,0.16,4.33,0.21,6.31l0.1,3.88l0.03,1.72c0,0.45,0,0.71,0,0.71v-0.71l-0.03-1.72l-0.1-3.88c-0.05-1.98-0.12-4.08-0.21-6.31c-0.66-17.05-2.19-36.5-6.05-57.02c-8.91-47.44-29.63-88.39-53.96-119.31c-20.64-26.27-42.7-48.36-70.28-70.98c-47.56-38.96-110.65-78.73-184.83-97.21c-43.1-10.77-78.3-13.01-100.72-13.51l-28.57-0.63Z" fill="#555555"/>
              <path d="M664.65,555.29c-0.36-40.09,16.33-70.07,49.94-89.71c-19.06-27.98-47.33-43.45-84.38-46.55c-35.69-3.06-74.62,21.47-89.01,21.47c-15.26,0-51.14-20.74-79.81-20.74c-62.10,0.97-127.47,51.68-127.47,154.83c0,30.59,5.34,62.10,16.01,94.55c14.23,41.91,65.59,144.67,118.89,143.11c28.11-0.61,47.69-20.50,84.13-20.50c35.32,0,53.29,20.50,84.13,20.50c54.20-0.73,100.01-96.10,113.55-138.01c-71.21-33.69-106.62-118.89-85.98-218.95Zm-81.04-253.77c30.35-38.93,27.01-74.62,26.04-87.45c-26.04,1.70-56.39,18.44-73.79,39.66c-16.01,18.68-29.63,47.69-25.92,75.83c28.84,2.18,55.42-11.40,73.67-28.04Z" fill="#555555"/>
            </svg>
            Continue with Apple
          </button>
        </>
      )}
      {!isForgotPassword && (
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm z-10">
            <span className="px-2 bg-white text-gray-500" style={{backgroundColor: 'white'}}>Or</span>
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
      {!isForgotPassword && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={toggleAuthMode}
            className="mt-2 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      )}
      {isLogin && !isForgotPassword && (
        <div className="mt-4 text-right">
          <button
            onClick={handleForgotPassword}
            className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Forgot password?
          </button>
        </div>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
    </div>
  );
};
