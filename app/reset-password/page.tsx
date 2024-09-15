'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Link from 'next/link';

// ResetPasswordForm component
const ResetPasswordForm: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid password reset link.');
    }
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    try {
      if (auth) {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setMessage('Password has been reset successfully. You can now log in with your new password.');
      } else {
        throw new Error('Auth is not initialized');
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
      console.error(err);
    }
  };

  // Return statement for ResetPasswordForm
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reset Your Password</h1>
      {message && (
        <div>
          <p className="text-green-500 mb-4">{message}</p>
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Return to login
          </Link>
        </div>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!message && !error && (
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
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
}; // End of ResetPasswordForm component

// ResetPasswordPage component (main page component)
const ResetPasswordPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <ResetPasswordForm />
    </div>
  );
};

export default ResetPasswordPage;
