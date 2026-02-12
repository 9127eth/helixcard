import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserDocument } from '../lib/firebaseOperations';
import { useRouter } from 'next/navigation';
import { getDeviceInfo } from '../utils/deviceDetection';

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
