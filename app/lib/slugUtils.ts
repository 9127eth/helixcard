import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export function generateCardSlug(): string {
  return Math.random().toString(36).substring(2, 5);
}

export async function isCardSlugUnique(userId: string, cardSlug: string): Promise<boolean> {
  // Add null check for Firestore instance
if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  
    const cardRef = collection(db, 'users', userId, 'businessCards');
  const q = query(cardRef, where('cardSlug', '==', cardSlug));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}
export async function generateCardUrl(userId: string, cardSlug: string, isPrimary: boolean): Promise<string> {
  // Add null check for Firestore instance
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    throw new Error('User document does not exist');
  }

  const userData = userDoc.data();
  const username = userData.username;

  if (!username) {
    throw new Error('Username not found for user');
  }

  if (isPrimary) {
    return `https://www.helixcard.app/c/${username}`;
  } else {
    return `https://www.helixcard.app/c/${username}/${cardSlug}`;
  }
}

export function sanitizeCustomSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
}

function generateRandomSlug(): string {
  // Implementation to generate a random slug
  // For example:
  return Math.random().toString(36).substring(2, 15);
}

export async function generateUniqueUsername(): Promise<string> {
  let username = generateRandomSlug().substring(0, 6); // Use 6 characters for username
  let isUnique = false;

  while (!isUnique) {
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }
  
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      isUnique = true;
    } else {
      username = generateRandomSlug().substring(0, 6);
    }
  }

  return username;
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]{3,20}$/;
  return slugRegex.test(slug);
}

export function generateUsername(): string {
  return Math.random().toString(36).substring(2, 8);
}
