import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function generateCardSlug(isPro: boolean, customSlug?: string): string {
  if (isPro && customSlug) {
    return sanitizeSlug(customSlug);
  }
  return generateRandomSlug();
}

export async function isCardSlugUnique(userId: string, cardSlug: string): Promise<boolean> {
  if (!db) {
    throw new Error('Firestore database is not initialized');
  }
  const cardRef = collection(db, 'users', userId, 'businessCards');
  const q = query(cardRef, where('cardSlug', '==', cardSlug));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}

export function generateCardUrl(isPro: boolean, username: string, cardSlug: string, isPrimary: boolean): string {
  if (isPro) {
    return isPrimary
      ? `https://www.helixcard.app/c/${username}`
      : `https://www.helixcard.app/c/${username}/${cardSlug}`;
  } else {
    return isPrimary
      ? `https://www.helixcard.app/c/${cardSlug}`
      : `https://www.helixcard.app/c/${username}/${cardSlug}`;
  }
}

function sanitizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
}

function generateRandomSlug(): string {
  return Math.random().toString(36).substring(2, 8);
}

export async function generateUniqueUsername(): Promise<string> {
  let username = generateRandomSlug();
  let isUnique = false;
  while (!isUnique) {
    if (!db) {
      throw new Error('Firestore database is not initialized');
    }
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      isUnique = true;
    } else {
      username = generateRandomSlug();
    }
  }

  return username;
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]{3,20}$/;
  return slugRegex.test(slug);
}
