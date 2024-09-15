import { firestore } from './firebase';
import { Firestore } from 'firebase/firestore';
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
  if (!db) throw new Error('Firestore database instance is undefined');

  try {
    console.log('Attempting to save business card for user:', user.uid);
    const userRef = doc(db, 'users', user.uid);
    console.log('User reference created');

    const userDoc = await getDoc(userRef);
    console.log('User document fetched');

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data();
    console.log('User data retrieved:', userData);

    let cardSlug = generateCardSlug(userData.isPro, customSlug);
    let isUnique = await isCardSlugUnique(user.uid, cardSlug);
    console.log('Card slug generated:', cardSlug, 'Is unique:', isUnique);

    while (!isUnique) {
      cardSlug = generateCardSlug(userData.isPro);
      isUnique = await isCardSlugUnique(user.uid, cardSlug);
      console.log('Regenerated card slug:', cardSlug, 'Is unique:', isUnique);
    }

    const cardRef = doc(collection(db, 'users', user.uid, 'businessCards'), cardSlug);
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
    console.log('Card URL generated:', cardUrl);

    return { cardSlug, cardUrl };
  } catch (error: unknown) {
    console.error('Error in saveBusinessCard:', error);
    if (error instanceof FirebaseError) {
      console.error('Firebase error code:', error.code);
      console.error('Firebase error message:', error.message);
      if (error.code === 'unavailable') {
        console.warn('Operation performed offline. Changes will be synced when online.');
        return { cardSlug: 'offline-' + Date.now(), cardUrl: 'Offline URL' };
      }
    }
    throw error;
  }
}

export async function setPrimaryCard(userId: string, cardSlug: string): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  const cardRef = doc(collection(firestore, 'users', userId, 'businessCards'), cardSlug);

  const userDoc = await getDoc(userRef);
  const cardDoc = await getDoc(cardRef);

  if (!userDoc.exists() || !cardDoc.exists()) {
    throw new Error('User or card not found');
  }

  const userData = userDoc.data();
  if (!userData.isPro) {
    throw new Error('Only pro users can set a primary card');
  }

  await runTransaction(firestore, async (transaction) => {
    // Update user document
    transaction.update(userRef, { primaryCardId: cardSlug });
    // Update all cards
    const cardsRef = collection(firestore, 'users', userId, 'businessCards');
    const cardsQuery = query(cardsRef);
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
  if (!db) throw new Error('Firestore database instance is undefined');

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
  if (!db) throw new Error('Firestore database instance is undefined');

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  return querySnapshot.docs[0].data() as User;
}

export async function updateUsername(userId: string, newUsername: string): Promise<void> {
  if (!db) throw new Error('Firestore database instance is undefined');

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
  if (!db) throw new Error('Firestore database instance is undefined');

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

  if (!db) {
    console.error('Firestore database instance is undefined');
    return;
  }

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
