import { db } from './firebase';
import { doc, setDoc, collection, updateDoc, getDoc, query, where, getDocs, runTransaction, Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { generateCardSlug, isCardSlugUnique, generateCardUrl } from './slugUtils';

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

export async function saveBusinessCard(
  user: User,
  cardData: BusinessCardData,
  customSlug?: string
): Promise<{ cardSlug: string; cardUrl: string }> {
  if (!db) {
    console.error('Firestore is not initialized.');
    throw new Error('Firestore is not initialized.');
  }

  console.log('Starting saveBusinessCard function');
  console.log('User:', user?.uid);
  console.log('Custom Slug:', customSlug);

  if (!user || !user.uid) {
    console.error('User not authenticated or invalid');
    throw new Error('User not authenticated or invalid');
  }

  const userRef = doc(db, 'users', user.uid);
  console.log('User reference created');

  try {
    const userDoc = await getDoc(userRef);
    console.log('User document fetched');

    if (!userDoc.exists()) {
      console.error('User document not found');
      throw new Error('User document not found');
    }

    const userData = userDoc.data();
    console.log('User data:', userData);

    let cardSlug = generateCardSlug(userData.isPro, customSlug);
    console.log('Generated card slug:', cardSlug);

    let isUnique = await isCardSlugUnique(user.uid, cardSlug);
    console.log('Is slug unique:', isUnique);

    while (!isUnique) {
      console.log('Slug not unique, generating new one');
      cardSlug = generateCardSlug(userData.isPro);
      isUnique = await isCardSlugUnique(user.uid, cardSlug);
    }

    const cardRef = doc(collection(db, 'users', user.uid, 'businessCards'), cardSlug);
    console.log('Card reference created');

    const isPrimary = !userData.primaryCardId;
    const cardWithMetadata = {
      ...cardData,
      cardSlug,
      isPrimary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Saving card data:', cardWithMetadata);
    await setDoc(cardRef, cardWithMetadata);
    console.log('Card data saved successfully');

    if (isPrimary) {
      console.log('Updating primary card ID');
      await updateDoc(userRef, { primaryCardId: cardSlug });
      console.log('Primary card ID updated');
    }

    const cardUrl = generateCardUrl(userData.isPro, userData.username, cardSlug, isPrimary);
    console.log('Generated card URL:', cardUrl);

    return { cardSlug, cardUrl };
  } catch (error) {
    console.error('Error in saveBusinessCard:', error);
    throw error;
  }
}

export async function setPrimaryCard(userId: string, cardSlug: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

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

   // Add null check for Firestore instance
if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  
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
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  let username = generateRandomUsername();
  let isUnique = false;

  while (!isUnique) {
    const usersRef = collection(db as Firestore, 'users');
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
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  return querySnapshot.docs[0].data() as User;
}

export async function updateUsername(userId: string, newUsername: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

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
  // Add null check for Firestore instance
if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  
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

  if (!db) {
    throw new Error('Firestore is not initialized.');
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

export const isOnline = () => typeof window !== 'undefined' && navigator.onLine;
