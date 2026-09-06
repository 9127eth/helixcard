'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Layout from '../components/Layout';
import Link from 'next/link';

const ResetPasswordForm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(true);
  const [isLinkValid, setIsLinkValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!auth || !oobCode) {
      setError('Invalid password reset link.');
      setIsCheckingCode(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => setIsLinkValid(true))
      .catch(err => {
        console.error('Invalid password reset code:', err);
        setError('This password reset link is invalid or has expired. Please request a new one.');
      })
      .finally(() => setIsCheckingCode(false));
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (!auth) {
        setError('Authentication is not initialized.');
        return;
      }
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage('Password has been reset successfully. You can now log in with your new password.');
    } catch (err) {
      setError('We could not reset your password. The link may have expired; please request a new one.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reset Your Password</h1>
      {message && (
        <div>
          <p className="text-green-500 mb-4">{message}</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Return to login
          </Link>
        </div>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {isCheckingCode && <p className="text-gray-600 dark:text-gray-300">Checking your reset link…</p>}
      {!isCheckingCode && isLinkValid && !message && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter new password"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Confirm new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {isSubmitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};

const ResetPasswordPage: React.FC = () => {
  return (
    <Layout title="Reset Password - HelixCard">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </Layout>
  );
};

export default ResetPasswordPage;
