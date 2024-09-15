'use client';

import React, { useState } from 'react';
import { RegisterForm } from './RegisterForm';
import { LoginForm } from './LoginForm';
import { useAuth } from '../hooks/useAuth';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { saveBusinessCard } from '../lib/firebaseOperations';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createUserDocument } from '../lib/firebaseOperations';

export const AuthModal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(false); // Changed to false
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { user } = useAuth();

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
  };

  const handleSuccess = () => {
    console.log('Authentication successful');
    // Add any additional logic here
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      if (!auth) {
        throw new Error('Auth instance is not initialized');
      }
      const userCredential = await signInWithPopup(auth, provider);
      if (!db) {
        throw new Error('Firestore instance is not initialized');
      }
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await createUserDocument(userCredential.user);
      }
      handleSuccess();
    } catch (error: unknown) {
      console.error('Google Sign-In Error:', error);
      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'failed-precondition' || firebaseError.code === 'unavailable') {
          alert('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          alert('An error occurred during sign-in. Please try again later.');
        }
      } else {
        alert('An unexpected error occurred during sign-in. Please try again later.');
      }
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
  };

  const handleCancelForgotPassword = () => {
    setIsForgotPassword(false);
  };

  const handleCreateCard = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const cardData = {
        name: 'Test User',
        jobTitle: 'Developer',
        company: 'Test Company',
        phoneNumber: '123-456-7890',
        email: 'test@example.com',
        aboutMe: 'This is a test card',
        specialty: 'Testing',
        linkedIn: 'https://linkedin.com/in/testuser',
        twitter: 'https://twitter.com/testuser',
        customMessage: 'Hello, this is a test card!',
      };

      const { cardSlug, cardUrl } = await saveBusinessCard(user, cardData);
      console.log('New card created with slug:', cardSlug);
      console.log('New card URL:', cardUrl);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  if (user) {
    return (
      <div>
        <button onClick={handleCreateCard}>Create Test Card</button>
      </div>
    );
  }

  return (
    <div className="bg-off-white dark:bg-black p-8 rounded-lg shadow-md w-full max-w-md">
      <h4 className="text-2xl font-bold mb-6 text-center text-black dark:text-off-white">
        {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
      </h4>
      {!isForgotPassword && (
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
    </div>
  );
};
