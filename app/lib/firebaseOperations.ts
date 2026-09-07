import { db } from './firebase';
import {
  increment,
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
import type { CardColors, CardEffect } from '../types';
import { prepareCardAppearance } from './cardAppearance';
import { normalizeCardUrls } from './cardUrls';
import { refreshUsageAfterDelete, syncUsage } from './usageClient';
import { auth } from './firebase';

// Added UserData interface
interface UserData {
  isPro: boolean;
  isProType: 'monthly' | 'yearly' | 'lifetime' | 'free';
  email?: string;
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

function isFile(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

function validateCvFile(file: File) {
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed for CV upload');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('CV file size exceeds the 5MB limit');
  }
}

async function deleteStorageObjectBestEffort(url: string | undefined, context: string) {
  if (!storage || !url) return;

  try {
    await deleteObject(ref(storage, url));
  } catch (error) {
    // Database writes are authoritative. A failed cleanup can be retried later,
    // while failing the completed save/delete would mislead the user.
    console.error(`Unable to clean up ${context}:`, error);
  }
}

async function deleteCardStorageIfUnreferenced(
  userId: string,
  cardId: string,
  url: string | undefined,
  context: string
) {
  if (!db || !url) return;

  try {
    // Older uploads used the local filename as the object key, so two cards may
    // already share one object. Keep it until the last card stops referencing it.
    const cards = await getDocs(collection(db, 'users', userId, 'businessCards'));
    const isStillReferenced = cards.docs.some(card => {
      if (card.id === cardId) return false;
      const data = card.data() as BusinessCardData;
      return data.imageUrl === url || data.cvUrl === url;
    });

    if (!isStillReferenced) {
      await deleteStorageObjectBestEffort(url, context);
    }
  } catch (error) {
    console.error(`Unable to check references for ${context}:`, error);
  }
}

const CLEARABLE_TEXT_FIELDS = [
  'middleName',
  'lastName',
  'prefix',
  'credentials',
  'pronouns',
  'jobTitle',
  'company',
  'phoneNumber',
  'email',
  'aboutMe',
  'customMessage',
  'customMessageHeader',
] as const;

interface BusinessCardData {
  customColors?: CardColors | null;
  effect?: CardEffect;
  effectTour?: boolean;
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
  customMessageHeader?: string;
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
  imageUrl?: string;
  isActive: boolean;
}

export async function saveBusinessCard(user: User, cardData: BusinessCardData, cvFile?: File) {
  if (!user) throw new Error('User is not authenticated');
  if (!db) throw new Error('Firestore is not initialized');

  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data() as UserData;

  cardData = prepareCardAppearance(cardData, userData.isPro === true);
  // Constrain every link to http(s) before it is stored — Firestore rules
  // reject anything else, and this is what keeps a legacy scheme-less value
  // (e.g. "linkedin.com/in/me") saving cleanly.
  cardData = normalizeCardUrls(cardData);

  const businessCardsRef = collection(userRef, 'businessCards');

  const isFirstCard = !userData.primaryCardId || userData.primaryCardPlaceholder;
  let cardSlug = cardData.cardSlug || generateCardSlug();

  if (isFirstCard) {
    cardSlug = userData.username || user.uid;
  }

  const newCardRef = doc(businessCardsRef, cardSlug);

  // The server owns the entitlement decision and seeds the counter that the
  // Firestore rule compares against.
  const existingCardDoc = await getDoc(newCardRef);
  const isNewCard = !existingCardDoc.exists();
  if (isNewCard) {
    const usage = await syncUsage();
    if (usage && !usage.canCreateCard) {
      throw new Error(
        usage.isPro
          ? `You have reached the ${usage.cardLimit} card limit for your plan.`
          : 'Upgrade to Helix Pro to create additional cards.'
      );
    }
  }

  const batch = writeBatch(db);

  let cvUrl: string | undefined;
  const pendingCv = cvFile || (isFile(cardData.cv) ? cardData.cv : undefined);
  const oldCvUrl = existingCardDoc.exists()
    ? (existingCardDoc.data() as BusinessCardData).cvUrl
    : undefined;
  const oldImageUrl = existingCardDoc.exists()
    ? (existingCardDoc.data() as BusinessCardData).imageUrl
    : undefined;

  if (pendingCv) {
    validateCvFile(pendingCv);

    try {
      cvUrl = await uploadCv(user.uid, pendingCv);
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

  // Creating a card consumes one unit of quota. The rule requires this +1 to be
  // part of the same batch as the card document itself.
  batch.update(userRef, {
    ...(isFirstCard && {
      primaryCardId: cardSlug,
      primaryCardPlaceholder: false,
    }),
    ...(isNewCard && { cardCount: increment(1) }),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    await deleteStorageObjectBestEffort(cvUrl, 'failed CV upload');
    throw error;
  }

  if (cvUrl && oldCvUrl && oldCvUrl !== cvUrl) {
    await deleteCardStorageIfUnreferenced(user.uid, cardSlug, oldCvUrl, 'replaced CV');
  }

  if (oldImageUrl && oldImageUrl !== cleanedCardData.imageUrl) {
    await deleteCardStorageIfUnreferenced(user.uid, cardSlug, oldImageUrl, 'replaced card image');
  }

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

  // Set the current primary card to non-primary. `isActive` is derived from the
  // owner's plan plus primacy (and Firestore rules enforce exactly that), so it
  // has to move with `isPrimary`.
  const userData = userDoc.data() as UserData;
  const isPro = userData.isPro === true;

  if (userData.primaryCardId && userData.primaryCardId !== cardSlug) {
    const currentPrimaryCardRef = doc(userRef, 'businessCards', userData.primaryCardId);
    batch.update(currentPrimaryCardRef, { isPrimary: false, isActive: isPro });
  }

  // Set the new card as primary
  batch.update(cardRef, { isPrimary: true, isActive: true });

  // Update the user's primaryCardId
  batch.update(userRef, { primaryCardId: cardSlug });

  await batch.commit();

  // Generate the new primary card URL
  await generateCardUrl(userId, cardSlug, true);
}

/**
 * Change the account's handle.
 *
 * `username` is server-owned now: Firestore rules reject client writes to it and
 * the handle is reserved transactionally in `/usernames`, so two accounts can no
 * longer end up on the same public URL.
 */
export async function updateUsername(userId: string, newUsername: string): Promise<void> {
  const user = auth?.currentUser;
  if (!user || user.uid !== userId) {
    throw new Error('User is not authenticated');
  }

  const idToken = await user.getIdToken();
  const response = await fetch('/api/username', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, username: newUsername }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to update username');
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
      email: user.email || '',
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

  const [owner, existingCard] = await Promise.all([
    getDoc(doc(db, 'users', userId)),
    getDoc(cardRef),
  ]);
  cardData = prepareCardAppearance(cardData, owner.data()?.isPro === true, existingCard.data());
  cardData = normalizeCardUrls(cardData);

  // Handle CV file upload
  let uploadedCvUrl: string | undefined;
  const oldCvUrl = (existingCard.data() as BusinessCardData | undefined)?.cvUrl;
  const oldImageUrl = (existingCard.data() as BusinessCardData | undefined)?.imageUrl;
  if (isFile(cardData.cv)) {
    validateCvFile(cardData.cv);
    try {
      uploadedCvUrl = await uploadCv(userId, cardData.cv);
      cardData.cvUrl = uploadedCvUrl;
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

  // Clearing a field must delete it. `updateDoc` leaves the previous value
  // in place when the key is omitted, and the public card URL then still
  // shows the old company / title / etc.
  for (const field of CLEARABLE_TEXT_FIELDS) {
    if (!(field in cleanedCardData)) continue;
    const value = cleanedCardData[field];
    if (typeof value === 'string' && value.trim() === '') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cleanedCardData as any)[field] = deleteField();
    }
  }

  // `isPrimary` and `isActive` are derived, not editable. The card form carries
  // them along with everything else, and a stale value there would be rejected
  // by the Firestore rule that ties them to the owner's plan and primary card —
  // so recompute both from the authoritative state instead of trusting the form.
  const isPrimary = existingCard.data()?.isPrimary === true;
  cleanedCardData.isPrimary = isPrimary;
  cleanedCardData.isActive = owner.data()?.isPro === true || isPrimary;

  try {
    await updateDoc(cardRef, cleanedCardData);
  } catch (error) {
    await deleteStorageObjectBestEffort(uploadedCvUrl, 'failed CV upload');
    throw error;
  }

  if (uploadedCvUrl && oldCvUrl && oldCvUrl !== uploadedCvUrl) {
    await deleteCardStorageIfUnreferenced(userId, cardId, oldCvUrl, 'replaced CV');
  }

  if ('imageUrl' in cleanedCardData && oldImageUrl !== cleanedCardData.imageUrl) {
    await deleteCardStorageIfUnreferenced(userId, cardId, oldImageUrl, 'replaced card image');
  }
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

  await Promise.all([
    deleteCardStorageIfUnreferenced(user.uid, cardSlug, cardData.imageUrl, 'deleted card image'),
    deleteCardStorageIfUnreferenced(user.uid, cardSlug, cardData.cvUrl, 'deleted card CV'),
  ]);

  // The client can never lower its own counter; the server recount does it.
  refreshUsageAfterDelete();
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
    // Clear the live reference first. Storage cleanup is deliberately second so
    // a failed Firestore update never leaves the card pointing at a missing file.
    await updateDoc(cardRef, {
      cvUrl: deleteField(),
      updatedAt: serverTimestamp(),
    });

    await deleteCardStorageIfUnreferenced(userId, cardId, cardData.cvUrl, 'deleted CV');
  }
}
export async function getUserCardCount(userId: string): Promise<number> {
  if (!db) throw new Error('Firestore is not initialized');
  
  const cardsRef = collection(db, 'users', userId, 'businessCards');
  const q = query(cardsRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

/**
 * Ask the server whether another card may be created.
 *
 * This used to be decided entirely in the browser by counting documents, which
 * anyone could skip. The answer now comes from `/api/usage`, which also writes
 * the counter that Firestore rules check the create against.
 */
export async function canCreateCard(userId: string): Promise<boolean> {
  if (auth?.currentUser?.uid !== userId) return false;

  const usage = await syncUsage();
  if (usage) return usage.canCreateCard;

  // Offline or transient failure: fall back to the local count so the UI still
  // renders something sensible. The write itself is still gated by rules.
  const userDoc = await getDoc(doc(db!, 'users', userId));
  const userData = userDoc.data();
  if (userData?.primaryCardPlaceholder) return true;

  const cardCount = await getUserCardCount(userId);
  return cardCount < (userData?.isPro ? PRO_USER_CARD_LIMIT : FREE_USER_CARD_LIMIT);
}

/**
 * Browser-side variant, kept for in-app use. Server code must use
 * `syncCardActiveStatus` in `lib/adminCards.ts` — the browser SDK cannot
 * authenticate from an API route.
 */
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
    email: email || '',
    // Add source and group if available
    ...(source && { source }),
    ...(group && { group })
  };

  await setDoc(doc(db, 'users', userId), userData);
}
