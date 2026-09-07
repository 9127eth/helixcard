import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserDocument } from '../lib/firebaseOperations';
import { useRouter } from 'next/navigation';
import { getDeviceInfo } from '../utils/deviceDetection';

async function syncAccountEmail(user: User) {
  if (!user.email || typeof window === 'undefined') return;

  const syncKey = `helix-email-sync:${user.uid}:${user.email.toLowerCase()}`;
  if (sessionStorage.getItem(syncKey)) return;
  sessionStorage.setItem(syncKey, 'pending');

  try {
    const idToken = await user.getIdToken();
    const response = await fetch('/api/auth/email', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'sync' }),
    });

    const result = await response.json().catch(() => null);
    if (response.ok && result?.stripeSynced !== false) {
      sessionStorage.setItem(syncKey, 'true');
    } else {
      sessionStorage.removeItem(syncKey);
    }
  } catch (error) {
    sessionStorage.removeItem(syncKey);
    // Authentication should not be blocked by an ancillary metadata sync. A
    // later auth state or Settings visit can retry it.
    console.error('Unable to synchronize account email:', error);
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      console.error('Authentication is not initialized.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
        void syncAccountEmail(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const logout = async () => {
    if (!auth) {
      console.error('Authentication is not initialized.');
      return;
    }
    try {
      await signOut(auth);
      window.location.href = '/'; // Redirect to home page after sign out
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) {
      console.error('Authentication is not initialized.');
      throw new Error('Authentication is not initialized.');
    }
    try {
      const userCredential = await import('firebase/auth').then(({ createUserWithEmailAndPassword }) => 
        createUserWithEmailAndPassword(auth!, email, password)
      );
      
      // Get device info
      const deviceInfo = getDeviceInfo();
      
      await createUserDocument(userCredential.user, deviceInfo);

      try {
        const idToken = await userCredential.user.getIdToken();
        const response = await fetch('/api/auth/email', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'welcome' }),
        });

        if (!response.ok) {
          throw new Error(`Welcome email request failed (${response.status})`);
        }
      } catch (emailError) {
        // Account creation should still succeed if email delivery is temporarily unavailable.
        console.error('Unable to send welcome email:', emailError);
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Error during sign up:', error);
      if (error instanceof Error) {
        if (error.message.includes('auth/email-already-in-use')) {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }
      }
      throw error;
    }
  };

  return { user, loading, logout, signUp };
}
