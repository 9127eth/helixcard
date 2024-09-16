import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserDocument } from '../lib/firebaseOperations';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      // Add null check for 'auth'
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
     // Add null check for 'auth'
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
      // Add null check for 'auth'
  if (!auth) {
    console.error('Authentication is not initialized.');
    throw new Error('Authentication is not initialized.');
  }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User authenticated:', userCredential.user.uid);
      
      // Create user document immediately after authentication
      await createUserDocument(userCredential.user);
      
      console.log('User signed up and document created successfully');
    } catch (error) {
      console.error('Error during sign up:', error);
      throw error;
    }
  };

  return { user, loading, logout, signUp };
}
