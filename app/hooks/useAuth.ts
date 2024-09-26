import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
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

    // Handle the redirect result after Google Sign-In on mobile devices
    const handleRedirectResult = async () => {
      if (!auth) {
        console.error('Authentication is not initialized.');
        return;
      }
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('Google Sign-In successful:', result.user.uid);
          // Create user document if needed
          await createUserDocument(result.user);
          // Redirect to the homepage/dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };

    handleRedirectResult();

    return () => unsubscribe();
  }, [router]); // Add router to the dependency array

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
