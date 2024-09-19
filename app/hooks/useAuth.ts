import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserDocument } from '../lib/firebaseOperations';
import { useRouter, usePathname } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.error('Authentication is not initialized.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (!auth) {
      console.error('Authentication is not initialized.');
      return;
    }
    try {
      await signOut(auth);
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
      console.log('Starting user creation with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User authenticated:', userCredential.user.uid);
      
      console.log('Attempting to create user document...');
      await createUserDocument(userCredential.user);
      console.log('User document created successfully');
      
      console.log('User signed up and document created successfully');
      return userCredential.user;
    } catch (error) {
      console.error('Error during sign up:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  };

  return { user, loading, logout, signUp };
}
