import { db } from './firebase';
import { doc, setDoc, collection, updateDoc, getDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
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

export async function saveBusinessCard(user: User, cardData: BusinessCardData, customSlug?: string): Promise<{ cardSlug: string; cardUrl: string }> {
  console.log('Starting saveBusinessCard function');
  console.log('User:', user);
  console.log('CardData:', cardData);

  if (!user || !user.uid) throw new Error('User not authenticated or invalid');

  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  let userData;
  if (!userDoc.exists()) {
    const username = await generateUniqueUsername();
    userData = {
      username,
      isPro: false,
      primaryCardId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, userData);
  } else {
    userData = userDoc.data();
  }

  console.log('About to create/update user document');

  let cardSlug = generateCardSlug(userData.isPro, customSlug);
  let isUnique = await isCardSlugUnique(user.uid, cardSlug);

  while (!isUnique) {
    cardSlug = generateCardSlug(userData.isPro);
    isUnique = await isCardSlugUnique(user.uid, cardSlug);
  }

  const cardRef = doc(collection(db, 'users', user.uid, 'businessCards'), cardSlug);
  const cardWithMetadata = {
    ...cardData,
    cardSlug,
    isPrimary: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('About to create business card document');

  await setDoc(cardRef, cardWithMetadata);

  if (!userData.primaryCardId) {
    await updateDoc(userRef, { primaryCardId: cardSlug });
  }

  const cardUrl = generateCardUrl(userData.username, cardSlug);

  return { cardSlug, cardUrl };
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

  await updateDoc(userRef, { primaryCardId: cardSlug });

  const cardsQuery = query(collection(db, 'users', userId, 'businessCards'));
  const cardsSnapshot = await getDocs(cardsQuery);

  const batch = writeBatch(db);
  cardsSnapshot.forEach((doc) => {
    batch.update(doc.ref, { isPrimary: doc.id === cardSlug });
  });

  await batch.commit();
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
  return 'user_' + Math.random().toString(36).substr(2, 9);
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
