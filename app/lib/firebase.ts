'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== 'undefined') {
  try {
    console.log('Initializing Firebase...');
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    console.log('Firebase app initialized:', app.name);
    
    auth = getAuth(app);
    console.log('Firebase auth initialized');
    
    db = getFirestore(app);
    console.log('Firebase Firestore initialized');
    
    storage = getStorage(app);
    console.log('Firebase storage initialized');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

const actionCodeSettings = {
  url: 'https://www.helixcard.app/reset-password',
  handleCodeInApp: true,
};

export { app, auth, db, storage, actionCodeSettings };

export const initFirebase = () => {
  if (typeof window !== 'undefined' && !app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
};

