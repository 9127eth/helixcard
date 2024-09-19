import { db } from './firebase';
import {
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { generateCardUrl, generateUniqueUsername, generateCardSlug } from './slugUtils';

// Added UserData interface
interface UserData {
  isPro: boolean;
  username: string | null;
  primaryCardId: string | null;
  primaryCardPlaceholder: boolean;
}

interface BusinessCardData {
  name: string;
  jobTitle: string;
  company: string;
  phoneNumber: string;
  email: string;
  aboutMe: string;
  linkedIn: string;
  twitter: string;
  customMessage: string;
  customSlug?: string; // Optional property
  cardSlug: string;
  prefix: string;
  credentials: string;
  pronouns: string;
  facebookUrl: string;
  instagramUrl: string;
  profilePicture?: File;
  cv?: File;
  isPrimary: boolean; // Added property
  // Remove specialty if you no longer use it
  // specialty: string;
}

export async function saveBusinessCard(user: User, cardData: BusinessCardData) {
  if (!user) throw new Error('User is not authenticated');
  if (!db) throw new Error('Firestore is not initialized');

  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data() as UserData;

  const businessCardsRef = collection(userRef, 'businessCards');

  const isFirstCard = !userData.primaryCardId;
  const isPlaceholder = userData.primaryCardPlaceholder;

  let cardSlug = cardData.cardSlug || generateCardSlug();

  if (isFirstCard || isPlaceholder) {
    cardSlug = userData.username || user.uid;
  }

  const newCardRef = doc(businessCardsRef, cardSlug);
  const batch = writeBatch(db);

  batch.set(newCardRef, {
    ...cardData,
    cardSlug,
    isPrimary: isFirstCard || isPlaceholder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (isFirstCard || isPlaceholder) {
    batch.update(userRef, {
      primaryCardId: cardSlug,
      primaryCardPlaceholder: false,
    });
  }

  await batch.commit();

  const cardUrl = await generateCardUrl(user.uid, cardSlug, isFirstCard || isPlaceholder);

  return { cardSlug, cardUrl };
}

export async function setPrimaryCard(userId: string, cardSlug: string): Promise<void> {
  if (!db) {
    throw new Error('Firebase database is not initialized');
  }
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User document does not exist');
  }

  const cardRef = doc(userRef, 'businessCards', cardSlug);
  const cardDoc = await getDoc(cardRef);

  if (!cardDoc.exists()) {
    throw new Error('Business card does not exist');
  }

  const batch = writeBatch(db);

  // Set the current primary card to non-primary
  const userData = userDoc.data() as UserData;
  if (userData.primaryCardId) {
    const currentPrimaryCardRef = doc(userRef, 'businessCards', userData.primaryCardId);
    batch.update(currentPrimaryCardRef, { isPrimary: false });
  }

  // Set the new card as primary
  batch.update(cardRef, { isPrimary: true });

  // Update the user's primaryCardId
  batch.update(userRef, { primaryCardId: cardSlug });

  await batch.commit();

  // Generate and return the new primary card URL
  const newPrimaryCardUrl = await generateCardUrl(userId, cardSlug, true);
  console.log('New primary card URL:', newPrimaryCardUrl);
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

  const userRef = doc(db, 'users', userId);
  
  try {
    await updateDoc(userRef, {
      username: newUsername,
      updatedAt: serverTimestamp(),
    });
    console.log('Username updated successfully for UID:', userId);
  } catch (error) {
    console.error('Error updating username:', error);
    throw error;
  }
}

async function _isUsernameUnique(username: string): Promise<boolean> {
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
  console.log('Entered createUserDocument function');

  if (!user || !user.uid) {
    console.error('Invalid user object:', user);
    return;
  }

  if (!db) {
    console.error('Firestore is not initialized.');
    throw new Error('Firestore is not initialized.');
  }

  console.log('Creating user document for UID:', user.uid);

  const userRef = doc(db, 'users', user.uid);
  try {
    // Check if the document already exists
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      console.log('User document already exists. Skipping creation.');
      return;
    }

    let username;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      username = await generateUniqueUsername();
      console.log('Generated username:', username);
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate a unique username after multiple attempts');
      }
    } while (!(await _isUsernameUnique(username)));

    const userData = {
      isPro: false,
      primaryCardId: null,
      username,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, userData);
    console.log('User document created successfully for UID:', user.uid);
  } catch (error) {
    console.error('Error creating user document:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error; // Re-throw the error to be handled by the calling function
  }
}

export const isOnline = () => typeof window !== 'undefined' && navigator.onLine;

export async function getBusinessCard(userId: string, cardId: string) {
  if (!db) throw new Error('Firestore is not initialized');
  const cardRef = doc(db, 'users', userId, 'businessCards', cardId);
  const cardSnap = await getDoc(cardRef);
  if (cardSnap.exists()) {
    return { id: cardSnap.id, ...cardSnap.data() };
  } else {
    throw new Error('Business card not found');
  }
}

export async function updateBusinessCard(userId: string, cardId: string, cardData: Partial<BusinessCardData>) {
  if (!db) throw new Error('Firebase database is not initialized');
  const cardRef = doc(db, 'users', userId, 'businessCards', cardId);
  await updateDoc(cardRef, cardData);
}

export const deleteBusinessCard = async (user: User, cardSlug: string) => {
  if (!user) throw new Error('User not authenticated');
  if (!db) throw new Error('Firestore is not initialized');

  const userRef = doc(db, 'users', user.uid);
  const cardRef = doc(userRef, 'businessCards', cardSlug);

  // Fetch the card to check if it's primary
  const cardDoc = await getDoc(cardRef);
  if (!cardDoc.exists()) throw new Error('Business card does not exist');

  const cardData = cardDoc.data() as BusinessCardData;
  // Start a batch
  const batch = writeBatch(db);

  // Delete the card
  batch.delete(cardRef);

  if (cardData.isPrimary) {
    // Update user document to set primaryCardId to null and primaryCardPlaceholder to true
    batch.update(userRef, {
      primaryCardId: null,
      primaryCardPlaceholder: true,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
};
