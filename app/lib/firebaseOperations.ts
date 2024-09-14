import { db } from './firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { User } from 'firebase/auth';

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

export async function saveBusinessCard(user: User, cardData: BusinessCardData) {
  if (!user) throw new Error('User not authenticated');

  const cardId = generateUniqueId();
  const cardUrl = generateCardUrl(cardId);

  const cardWithMetadata = {
    ...cardData,
    userId: user.uid,
    cardId,
    cardUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const cardRef = doc(collection(db, 'users', user.uid, 'businessCards'), cardId);
  await setDoc(cardRef, cardWithMetadata);

  return { cardId, cardUrl };
}

function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function generateCardUrl(cardId: string): string {
  return `https://helixcard.app/${cardId}`;
}
