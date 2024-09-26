import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserDocument } from '../lib/firebaseOperations';
import { useRouter } from 'next/navigation';

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
      console.log('Starting user creation with email:', email);
      const userCredential = await import('firebase/auth').then(({ createUserWithEmailAndPassword }) => 
        createUserWithEmailAndPassword(auth!, email, password)
      );
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
