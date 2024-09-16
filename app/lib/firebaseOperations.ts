import { db } from './firebase';
import { doc, setDoc, collection, updateDoc, getDoc, query, where, getDocs, writeBatch, serverTimestamp, Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { generateCardSlug, generateCardUrl } from './slugUtils';
import { generateUniqueUsername } from './slugUtils';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Added UserData interface
interface UserData {
  isPro: boolean;
  username: string | null;
  primaryCardId: string | null;
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
  customSlug?: string; // Added customSlug as an optional property
  prefix: string;
  credentials: string;
  pronouns: string;
  facebookUrl: string;
  instagramUrl: string;
  profilePicture?: File;
  cv?: File;
  // Remove specialty if you no longer use it
  // specialty: string;
}

export async function saveBusinessCard(user: User, cardData: BusinessCardData): Promise<{ cardSlug: string; cardUrl: string }> {
  if (!db) {
    throw new Error('Firebase database is not initialized');
  }
  const userRef = doc(db as Firestore, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User document does not exist');
  }

  const userData = userDoc.data();
  const username = userData.username;

  if (!username) {
    throw new Error('Username not found for user');
  }

  const existingCards = await getDocs(collection(userRef, 'businessCards'));
  const isPrimary = existingCards.empty;

  let cardSlug: string;
  if (isPrimary) {
    cardSlug = username;
  } else {
    cardSlug = generateCardSlug(); // This generates a 3-character slug for additional cards
  }

  const cardRef = doc(collection(userRef, 'businessCards'), cardSlug);

  // Upload profile picture if provided
  let profilePictureUrl = null;
  if (cardData.profilePicture) {
    const storage = getStorage();
    const profilePictureRef = ref(storage, `profilePictures/${user.uid}/${Date.now()}_${cardData.profilePicture.name}`);
    await uploadBytes(profilePictureRef, cardData.profilePicture);
    profilePictureUrl = await getDownloadURL(profilePictureRef);
  }

  // Upload CV if provided
  let cvUrl = null;
  if (cardData.cv) {
    const storage = getStorage();
    const cvRef = ref(storage, `cvs/${user.uid}/${Date.now()}_${cardData.cv.name}`);
    await uploadBytes(cvRef, cardData.cv);
    cvUrl = await getDownloadURL(cvRef);
  }

  const cardDataToSave = {
    ...cardData,
    cardSlug,
    isPrimary,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    profilePictureUrl: profilePictureUrl,
    cvUrl: cvUrl,
  };

  await setDoc(cardRef, cardDataToSave);

  if (isPrimary) {
    await updateDoc(userRef, { primaryCardId: cardSlug });
  }

  const cardUrl = `https://www.helixcard.app/c/${username}${isPrimary ? '' : `/${cardSlug}`}`;

  return { cardSlug, cardUrl };
}

export async function setPrimaryCard(userId: string, cardSlug: string): Promise<void> {
  if (!db) {
    throw new Error('Firebase database is not initialized');
  }
  const userRef = doc(db as Firestore, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User document does not exist');
  }

  const cardRef = doc(collection(userRef, 'businessCards'), cardSlug);
  const cardDoc = await getDoc(cardRef);

  if (!cardDoc.exists()) {
    throw new Error('Business card does not exist');
  }

  const batch = writeBatch(db as Firestore);

  // Set the current primary card to non-primary
  const userData = userDoc.data() as UserData;
  if (userData.primaryCardId) {
    const currentPrimaryCardRef = doc(collection(userRef, 'businessCards'), userData.primaryCardId);
    batch.update(currentPrimaryCardRef, { isPrimary: false });
  }

  // Set the new card as primary
  batch.update(cardRef, { isPrimary: true });

  // Update the user's primaryCardId
  batch.update(userRef, { primaryCardId: cardSlug });

  await batch.commit();

  // Generate and return the new primary card URL
  const newPrimaryCardUrl = generateCardUrl(userId, cardSlug, true);
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
      updatedAt: new Date().toISOString(),
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
    let username;
    do {
      username = await generateUniqueUsername();
    } while (!(await _isUsernameUnique(username)));

    const userData = {
      isPro: false,
      primaryCardId: null,
      username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, userData, { merge: true });
    console.log('User document created/updated successfully for UID:', user.uid);
  } catch (error) {
    console.error('Error creating/updating user document:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
  }
}

export const isOnline = () => typeof window !== 'undefined' && navigator.onLine;
