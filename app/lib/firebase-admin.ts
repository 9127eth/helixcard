import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;

  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    throw new Error('Firebase environment variables are not set');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: storageBucket,
      databaseURL: `https://${projectId}.firebaseio.com`,
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Initialize storage if not already initialized
const storage = getStorage();

export default admin;
export const db = admin.firestore();
export const auth = admin.auth();
export { storage };
