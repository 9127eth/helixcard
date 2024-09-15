import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserDocument } from '../lib/firebaseOperations';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    if (auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User authenticated:', userCredential.user.uid);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Creating user document for UID:', userCredential.user.uid);
        await createUserDocument(userCredential.user);
        console.log('User signed up and document created successfully');
      } catch (error) {
        console.error('Error during sign up:', error);
        throw error;
      }
    }
  };

  return { user, loading, logout, signUp };
}
