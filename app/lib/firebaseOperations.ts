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
import { uploadCv } from './uploadUtils';
import { ref, deleteObject } from 'firebase/storage'; // Removed getStorage as it's not used
import { deleteField } from 'firebase/firestore';
import { storage } from './firebase'; // Assuming you have a firebase.ts file with these exports
import { FREE_USER_CARD_LIMIT, PRO_USER_CARD_LIMIT } from './constants';

// Added UserData interface
interface UserData {
  isPro: boolean;
  username: string | null;
  primaryCardId: string | null;
  primaryCardPlaceholder: boolean;
}

interface BusinessCardData {
  id?: string;
  description: string;
  firstName: string;
  middleName?: string;
  lastName: string;
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
  cv?: File;
  isPrimary: boolean; 
  cvUrl?: string;
  isActive: boolean;
}

export async function saveBusinessCard(user: User, cardData: BusinessCardData, cvFile?: File) {
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

  let cvUrl: string | undefined;

  if (cvFile) {
    // File type validation
    if (cvFile.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed for CV upload');
    }

    // File size validation (e.g., 5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (cvFile.size > MAX_FILE_SIZE) {
      throw new Error('CV file size exceeds the 5MB limit');
    }

    // Check if there's an existing CV and delete it
    const existingCardDoc = await getDoc(newCardRef);
    if (existingCardDoc.exists()) {
      const existingCardData = existingCardDoc.data() as BusinessCardData;
      if (existingCardData.cvUrl && storage) {
        const oldCvRef = ref(storage, existingCardData.cvUrl);
        await deleteObject(oldCvRef);
      }
    }

    try {
      cvUrl = await uploadCv(user.uid, cvFile);
    } catch (error) {
      console.error('Error uploading CV:', error);
      throw new Error('Failed to upload CV. Please try again.');
    }
  }

  // Remove the cv property from cardData
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cv, ...cardDataWithoutCv } = cardData;

  // Create a new object with only defined properties
  const cleanedCardData = Object.entries(cardDataWithoutCv).reduce((acc, [key, value]) => {
    if (value !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[key] = value;
    }
    return acc;
  }, {} as Partial<BusinessCardData>);

  // Add cvUrl only if it exists
  if (cvUrl) {
    cleanedCardData.cvUrl = cvUrl;
  }

  batch.set(newCardRef, {
    ...cleanedCardData,
    cardSlug,
    isPrimary: isFirstCard || isPlaceholder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isActive: userData.isPro || isFirstCard || isPlaceholder || cleanedCardData.isPrimary,
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
    const data = cardSnap.data();
    return { 
      id: cardSnap.id, 
      ...data, 
      isActive: data.isActive === undefined ? true : data.isActive 
    };
  } else {
    throw new Error('Business card not found');
  }
}

export async function updateBusinessCard(userId: string, cardId: string, cardData: Partial<BusinessCardData>) {
  if (!db) throw new Error('Firebase database is not initialized');
  if (!storage) throw new Error('Firebase storage is not initialized');

  const cardRef = doc(db, 'users', userId, 'businessCards', cardId);

  // Handle CV file upload
  if (cardData.cv instanceof File) {
    try {
      const cvUrl = await uploadCv(userId, cardData.cv);
      cardData.cvUrl = cvUrl;
    } catch (error) {
      console.error('Error uploading CV:', error);
      throw new Error('Failed to upload CV. Please try again.');
    }
  }

  // Remove the cv property from cardData
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cv, ...cardDataWithoutCv } = cardData;

  // Remove undefined fields
  const cleanedCardData = Object.entries(cardDataWithoutCv).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[key] = value;
    }
    return acc;
  }, {} as Partial<BusinessCardData>);

  // Only set isActive if it's explicitly provided in cardData
  if ('isActive' in cardData) {
    cleanedCardData.isActive = cardData.isActive;
  }

  await updateDoc(cardRef, cleanedCardData);
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

export async function deleteCv(userId: string, cardId: string) {
  if (!db) throw new Error('Firestore is not initialized');
  if (!storage) throw new Error('Firebase storage is not initialized');

  const cardRef = doc(db, 'users', userId, 'businessCards', cardId);
  const cardDoc = await getDoc(cardRef);

  if (!cardDoc.exists()) {
    throw new Error('Business card not found');
  }

  const cardData = cardDoc.data() as BusinessCardData;

  if (cardData.cvUrl) {
    // Delete the CV file from storage
    const cvRef = ref(storage, cardData.cvUrl);
    await deleteObject(cvRef);

    // Update the business card document to remove the CV URL
    await updateDoc(cardRef, {
      cvUrl: deleteField(),
      updatedAt: serverTimestamp(),
    });
  }
}
export async function getUserCardCount(userId: string): Promise<number> {
  if (!db) throw new Error('Firestore is not initialized');
  
  const cardsRef = collection(db, 'users', userId, 'businessCards');
  const q = query(cardsRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

export async function canCreateCard(userId: string): Promise<boolean> {
  if (!db) throw new Error('Firestore is not initialized');
  
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  const isPro = userData?.isPro || false;
  const primaryCardPlaceholder = userData?.primaryCardPlaceholder || false;

  // If there's a primary card placeholder, allow creating a new card
  if (primaryCardPlaceholder) {
    return true;
  }

  const cardCount = await getUserCardCount(userId);
  const limit = isPro ? PRO_USER_CARD_LIMIT : FREE_USER_CARD_LIMIT;
  return cardCount < limit;
}

export async function updateCardActiveStatus(userId: string, isPro: boolean) {
  if (!db) throw new Error('Firestore is not initialized');

  const userRef = doc(db, 'users', userId);
  const cardsRef = collection(userRef, 'businessCards');
  const cardsSnapshot = await getDocs(cardsRef);

  const batch = writeBatch(db);

  cardsSnapshot.forEach((cardDoc) => {
    const cardData = cardDoc.data() as BusinessCardData;
    batch.update(cardDoc.ref, {
      isActive: isPro || cardData.isPrimary
    });
  });

  await batch.commit();
}