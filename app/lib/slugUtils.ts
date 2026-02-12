import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export function generateCardSlug(): string {
  const blacklist = ['nig', 'fag', 'ass', 'sex', 'fat', 'gay'];
  let slug: string;
  do {
    slug = Math.random().toString(36).substring(2, 5);
  } while (blacklist.includes(slug));
  return slug;
}

export async function isCardSlugUnique(userId: string, cardSlug: string): Promise<boolean> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  
  const cardRef = collection(db, 'users', userId, 'businessCards');
  const q = query(cardRef, where('cardSlug', '==', cardSlug));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}

export async function generateCardUrl(userId: string, cardSlug: string, isPrimary: boolean): Promise<string> {
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

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]{3,20}$/;
  return slugRegex.test(slug);
}

export function generateUsername(): string {
  const blacklist = ['nig', 'fag', 'ass', 'sex', 'fat', 'gay'];
  let username: string;
  do {
    username = Math.random().toString(36).substring(2, 8);
  } while (blacklist.some(word => username.includes(word)));
  return username;
}
