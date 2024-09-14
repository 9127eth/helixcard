import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function generateCardSlug(isPro: boolean, customSlug?: string): string {
  if (isPro && customSlug) {
    return sanitizeSlug(customSlug);
  }
  return generateRandomSlug();
}

export async function isCardSlugUnique(userId: string, cardSlug: string): Promise<boolean> {
  const cardRef = collection(db, 'users', userId, 'businessCards');
  const q = query(cardRef, where('cardSlug', '==', cardSlug));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}

export function generateCardUrl(username: string, cardSlug?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.helixcard.app';
  if (cardSlug) {
    return `${baseUrl}/c/${username}/${cardSlug}`;
  }
  return `${baseUrl}/c/${username}`;
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
