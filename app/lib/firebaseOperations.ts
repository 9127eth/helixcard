import { db } from './firebase';
import {
  setDoc,
  collection,
  query,
  getDocs,
  writeBatch,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { generateCardUrl, generateCardSlug } from './slugUtils';
import { uploadCv } from './uploadUtils';
import { ref, deleteObject } from 'firebase/storage'; // Removed getStorage as it's not used
import { deleteField } from 'firebase/firestore';
import { storage } from './firebase'; // Assuming you have a firebase.ts file with these exports
import { FREE_USER_CARD_LIMIT, PRO_USER_CARD_LIMIT } from './constants';
import { DeviceInfo } from '../utils/deviceDetection';
import { Timestamp } from 'firebase/firestore';
import { getSourceForRegistration, clearStoredSource } from '../utils/sourceTracking';
import { getGroupFromSource } from '../utils/groupMapping';

// Added UserData interface
interface UserData {
  isPro: boolean;
  isProType: 'monthly' | 'yearly' | 'lifetime' | 'free';
  username: string | null;
  primaryCardId: string | null;
  primaryCardPlaceholder: boolean;
}

interface UserRegistrationData extends UserData {
  sourceDevice: string;
  sourceBrowser: string;
  sourcePlatform: string;
  registeredAt: FirebaseFirestore.Timestamp;
  source?: string;
  group?: string;
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

  const isFirstCard = !userData.primaryCardId || userData.primaryCardPlaceholder;
  let cardSlug = cardData.cardSlug || generateCardSlug();

  if (isFirstCard) {
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
    isPrimary: isFirstCard,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isActive: userData.isPro || isFirstCard,
  });

  if (isFirstCard) {
    batch.update(userRef, {
      primaryCardId: cardSlug,
      primaryCardPlaceholder: false,
    });
  }

  await batch.commit();

  const cardUrl = await generateCardUrl(user.uid, cardSlug, isFirstCard);

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

  // Generate the new primary card URL
  await generateCardUrl(userId, cardSlug, true);
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
  } catch (error) {
    console.error('Error updating username:', error);
    throw error;
  }
}

// Generate a unique username via server-side API (avoids cross-user Firestore reads)
async function generateUsernameViaApi(user: User): Promise<string> {
  const idToken = await user.getIdToken();
  const response = await fetch('/api/generate-username', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate unique username');
  }

  const data = await response.json();
  return data.username;
}

export function validateCustomUsername(username: string): boolean {
  const usernameRegex = /^[a-z0-9-]{3,20}$/;
  return usernameRegex.test(username);
}

export async function createUserDocument(user: User, deviceInfo?: DeviceInfo): Promise<void> {
  if (!user || !user.uid) {
    return;
  }

  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const userRef = doc(db, 'users', user.uid);
  try {
    // Check if the document already exists
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return;
    }

    // Generate username via server-side API (avoids cross-user Firestore reads)
    const username = await generateUsernameViaApi(user);

    // Get source information for affiliate tracking
    const source = getSourceForRegistration();
    const group = source ? getGroupFromSource(source) : null;
    
    // Clear stored source after capturing it
    if (source) {
      clearStoredSource();
    }

    const userData = {
      isPro: false,
      primaryCardId: username,
      username,
      primaryCardPlaceholder: true,
      isProType: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Add device info if provided
      ...(deviceInfo && {
        sourceDevice: deviceInfo.sourceDevice,
        sourceBrowser: deviceInfo.sourceBrowser,
        sourcePlatform: deviceInfo.sourcePlatform
      }),
      // Add source and group if available
      ...(source && { source }),
      ...(group && { group })
    };

    await setDoc(userRef, userData);
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}

export const isOnline = () => typeof window !== 'undefined' && navigator.onLine;

export async function getBusinessCard(userId: string, cardId: string) {
  if (!db) throw new Error('Firestore is not initialized');
  const cardRef = doc(db, 'users', userId, 'businessCards', cardId);
  const cardSnap = await getDoc(cardRef);
  if (cardSnap.exists()) {
    const data = cardSnap.data();
    
    // Fetch the user's pro status
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const isPro = userData?.isPro || false;
    
    return { 
      id: cardSnap.id, 
      ...data, 
      isActive: data.isActive === undefined ? true : data.isActive,
      isPro: isPro
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

export async function updateCardDepthColor(userId: string, cardSlug: string, color: string) {
  if (!db) throw new Error('Firestore is not initialized');
  
  const cardRef = doc(db, 'users', userId, 'businessCards', cardSlug);
  await updateDoc(cardRef, {
    cardDepthColor: color
  });
}

export async function createNewUser(
  userId: string, 
  email: string | null, 
  deviceInfo: DeviceInfo,
  username: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  // Get source information for affiliate tracking
  const source = getSourceForRegistration();
  const group = source ? getGroupFromSource(source) : null;
  
  // Clear stored source after capturing it
  if (source) {
    clearStoredSource();
  }
  
  const userData: UserRegistrationData = {
    username: username,
    isPro: false,
    primaryCardId: null,
    primaryCardPlaceholder: true,
    sourceDevice: deviceInfo.sourceDevice,
    sourceBrowser: deviceInfo.sourceBrowser,
    sourcePlatform: deviceInfo.sourcePlatform,
    registeredAt: Timestamp.fromDate(new Date()),
    isProType: 'free',
    // Add source and group if available
    ...(source && { source }),
    ...(group && { group })
  };

  await setDoc(doc(db, 'users', userId), userData);
}
