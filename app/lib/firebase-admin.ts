import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      // Remove the databaseURL line
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
