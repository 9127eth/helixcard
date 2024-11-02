import React, { useState } from 'react';
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';

interface ChangeEmailFormProps {
  onClose: () => void;
}

export const ChangeEmailForm: React.FC<ChangeEmailFormProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if the user's current email is verified
      if (!user.emailVerified) {
        setError('Please verify your current email address before changing it.');
        await sendEmailVerification(user);
        setIsLoading(false);
        return;
      }

      // Re-authenticate user before changing email
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, newEmail);

      alert('Email updated successfully');
      onClose();
    } catch (err) {
      console.error('Error updating email:', err);
      if (err instanceof Error) {
        if (err.message.includes('auth/operation-not-allowed')) {
          setError('Email change is not allowed. Please contact support.');
        } else if (err.message.includes('auth/requires-recent-login')) {
          setError('Please sign out and sign in again before changing your email.');
        } else if (err.message.includes('auth/email-already-in-use')) {
          setError('This email is already in use by another account.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to update email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="New Email Address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Current Password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white"
        >
          {isLoading ? 'Updating...' : 'Update Email'}
        </button>
      </div>
    </form>
  );
};