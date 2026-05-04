import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'next/navigation';

type ProviderId = 'password' | 'google.com' | 'apple.com' | 'unknown';

const DeleteAccountButton: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const providerId: ProviderId =
    (user?.providerData[0]?.providerId as ProviderId) || 'unknown';

  const closeModal = () => {
    setShowModal(false);
    setPassword('');
    setError(null);
  };

  const reauthenticate = async (): Promise<void> => {
    if (!user) throw new Error('Not signed in');

    if (providerId === 'password') {
      if (!password) {
        throw new Error('Please enter your password to confirm.');
      }
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      return;
    }

    if (providerId === 'google.com') {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      return;
    }

    if (providerId === 'apple.com') {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await reauthenticateWithPopup(user, provider);
      return;
    }

    throw new Error('Unsupported sign-in method. Please contact support.');
  };

  const mapReauthError = (err: unknown): string => {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
      return 'Incorrect password. Please try again.';
    }
    if (message.includes('auth/too-many-requests')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (message.includes('auth/popup-closed-by-user') || message.includes('auth/cancelled-popup-request')) {
      return 'Re-authentication was cancelled. Please try again to confirm deletion.';
    }
    if (message.includes('auth/network-request-failed')) {
      return 'Network error. Please check your connection and try again.';
    }
    return 'Could not verify your identity. Please try again.';
  };

  const handleDelete = async () => {
    if (!user || !auth) return;
    setError(null);
    setIsDeleting(true);

    try {
      // Step 1: Re-authenticate to confirm identity and refresh the auth_time claim.
      try {
        await reauthenticate();
      } catch (reauthErr) {
        setError(mapReauthError(reauthErr));
        setIsDeleting(false);
        return;
      }

      // Step 2: Get a fresh ID token (forceRefresh=true ensures auth_time is current)
      // and call the server-side endpoint that performs Firestore + Storage + Stripe +
      // Auth cleanup atomically.
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.error === 'requires-recent-login') {
          setError('Your session has expired. Please try again.');
        } else {
          setError(
            'We could not delete your account. Please try again or contact support.'
          );
        }
        setIsDeleting(false);
        return;
      }

      // Step 3: Sign the (now-deleted) user out locally and redirect home.
      try {
        await signOut(auth);
      } catch {
        // Ignore — the auth user no longer exists server-side.
      }
      router.push('/');
    } catch (err) {
      console.error('Unexpected error deleting account:', err);
      setError('Something went wrong. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        Delete Account
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Delete account</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This permanently deletes your account, business cards, contacts, and uploaded
              files. Any active subscription will be cancelled. This cannot be undone.
            </p>

            {providerId === 'password' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm your password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Current password"
                  autoFocus
                />
              </div>
            )}

            {(providerId === 'google.com' || providerId === 'apple.com') && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You&apos;ll be asked to sign in with{' '}
                {providerId === 'google.com' ? 'Google' : 'Apple'} again to confirm.
              </p>
            )}

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || (providerId === 'password' && !password)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAccountButton;
