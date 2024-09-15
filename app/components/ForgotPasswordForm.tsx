import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, actionCodeSettings } from '../lib/firebase';

interface ForgotPasswordFormProps {
  onCancel: () => void;
  onBackToSignIn: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onCancel, onBackToSignIn }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        setMessage('Password reset email sent. Please check your inbox.');
        setIsSubmitted(true);
      } else {
        throw new Error('Authentication is not initialized');
      }
    } catch (err) {
      setError('Failed to send password reset email. Please try again.');
      console.error(err);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <p className="text-green-500 mb-4">{message}</p>
        <button
          onClick={onBackToSignIn}
          className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Go back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {message && <p className="text-green-500 mb-4">{message}</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter your email"
          required
        />
      </div>
      <div className="flex justify-between">
        <button
          type="submit"
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Reset Password
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
