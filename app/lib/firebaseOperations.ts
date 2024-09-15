import { db } from './firebase';
import { doc, setDoc, collection, updateDoc, getDoc, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { generateCardSlug, isCardSlugUnique, generateCardUrl } from './slugUtils';
import { FirebaseError } from 'firebase/app';

interface BusinessCardData {
  name: string;
  jobTitle: string;
  company: string;
  phoneNumber: string;
  email: string;
  aboutMe: string;
  specialty: string;
  linkedIn: string;
  twitter: string;
  customMessage: string;
}

export async function saveBusinessCard(user: User, cardData: BusinessCardData, customSlug?: string): Promise<{ cardSlug: string; cardUrl: string }> {
  if (!user || !user.uid) throw new Error('User not authenticated or invalid');

  try {
    const userRef = doc(db, 'users', user.uid || 'defaultUser');
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data();

    let cardSlug = generateCardSlug(userData.isPro, customSlug);
    let isUnique = await isCardSlugUnique(user.uid, cardSlug);

    while (!isUnique) {
      cardSlug = generateCardSlug(userData.isPro);
      isUnique = await isCardSlugUnique(user.uid, cardSlug);
    }

    const cardRef = doc(collection(db, 'users', user.uid || 'defaultUser', 'businessCards'), cardSlug || 'defaultSlug');
    const isPrimary = !userData.primaryCardId;
    const cardWithMetadata = {
      ...cardData,
      cardSlug,
      isPrimary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(cardRef, cardWithMetadata);

    if (isPrimary) {
      await updateDoc(userRef, { primaryCardId: cardSlug });
    }

    const cardUrl = generateCardUrl(userData.isPro, userData.username, cardSlug, isPrimary);

    return { cardSlug, cardUrl };
  } catch (error: unknown) {
    if (error instanceof FirebaseError && error.code === 'unavailable') {
      // Handle offline scenario
      console.warn('Operation performed offline. Changes will be synced when online.');
      // You might want to store this operation in IndexedDB or local storage to sync later
      return { cardSlug: 'offline-' + Date.now(), cardUrl: 'Offline URL' };
    }
    throw error;
  }
}

export async function setPrimaryCard(userId: string, cardSlug: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const cardRef = doc(collection(db, 'users', userId, 'businessCards'), cardSlug);

  const userDoc = await getDoc(userRef);
  const cardDoc = await getDoc(cardRef);

  if (!userDoc.exists() || !cardDoc.exists()) {
    throw new Error('User or card not found');
  }

  const userData = userDoc.data();
  if (!userData.isPro) {
    throw new Error('Only pro users can set a primary card');
  }

  await runTransaction(db, async (transaction) => {
    // Update user document
    transaction.update(userRef, { primaryCardId: cardSlug });

    // Update all cards
    const cardsQuery = query(collection(db, 'users', userId, 'businessCards'));
    const cardsSnapshot = await getDocs(cardsQuery);

    cardsSnapshot.forEach((doc) => {
      const isNewPrimary = doc.id === cardSlug;
      transaction.update(doc.ref, { 
        isPrimary: isNewPrimary,
        cardUrl: generateCardUrl(userData.isPro, userData.username, doc.id, isNewPrimary)
      });
    });
  });
}

async function generateUniqueUsername(): Promise<string> {
  let username = generateRandomUsername();
  let isUnique = false;

  while (!isUnique) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      isUnique = true;
    } else {
      username = generateRandomUsername();
    }
  }

  return username;
}

function generateRandomUsername(): string {
  return Math.random().toString(36).substr(2, 9);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  return querySnapshot.docs[0].data() as User;
}

export async function updateUsername(userId: string, newUsername: string): Promise<void> {
  if (!validateCustomUsername(newUsername)) {
    throw new Error('Invalid username format');
  }

  const isUnique = await isUsernameUnique(newUsername);
  if (!isUnique) {
    throw new Error('Username is already taken');
  }

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    username: newUsername,
    updatedAt: new Date().toISOString(),
  });
}

async function isUsernameUnique(username: string): Promise<boolean> {
  const userQuery = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
  return userQuery.empty;
}

export function validateCustomUsername(username: string): boolean {
  const usernameRegex = /^[a-z0-9-]{3,20}$/;
  return usernameRegex.test(username);
}

export async function createUserDocument(user: User): Promise<void> {
  if (!user || !user.uid) {
    console.error('Invalid user object:', user);
    return;
  }

  console.log('Creating user document for UID:', user.uid);

  const userRef = doc(db, 'users', user.uid);

  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      const username = await generateUniqueUsername();
      const userData = {
        username,
        isPro: false,
        primaryCardId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, userData);
      console.log('User document created successfully for UID:', user.uid);
    } else {
      console.log('User document already exists for UID:', user.uid);
    }
  } catch (error) {
    console.error('Error creating user document:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
  }
}
