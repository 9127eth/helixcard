'use client';

import React from 'react';
import { User } from 'firebase/auth';
import { BusinessCardForm, BusinessCardData } from './BusinessCardForm';
import { saveBusinessCard } from '../lib/firebaseOperations';
import { useRouter } from 'next/navigation';
import { generateCardSlug } from '../lib/slugUtils';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Import necessary Firestore functions
import { db } from '../lib/firebase'; // Import the Firestore database instance

interface ClientCardCreatorProps {
  user: User | null;
}

const ClientCardCreator: React.FC<ClientCardCreatorProps> = ({ user }) => {
  const router = useRouter();

  const handleCreateCard = async (cardData: BusinessCardData) => {
    if (!user) {
      alert('You must be logged in to create a card.');
      return;
    }

    try {
      if (!db) {
        throw new Error('Firestore database instance is not available.');
      }
      // Fetch user document to check for existing primary card
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();

      const isFirstCard = !userData?.primaryCardId;
      const isPlaceholder = userData?.primaryCardPlaceholder === true;

      let cardSlug = generateCardSlug();

      // Use username as cardSlug for the first (primary) card
      if (isFirstCard || isPlaceholder) {
        if (!userData?.username) {
          throw new Error('Username not found for user');
        }
        cardSlug = userData.username;
      }

      const updatedCardData = {
        ...cardData,
        cardSlug,
        isPrimary: isFirstCard || isPlaceholder,
        name: `${cardData.firstName} ${cardData.lastName}`,
      };

      const { cardSlug: returnedCardSlug } = await saveBusinessCard(user, updatedCardData);

      // Update user document if this is the primary card
      if (isFirstCard || isPlaceholder) {
        await updateDoc(userDocRef, {
          primaryCardId: returnedCardSlug,
          primaryCardPlaceholder: false,
        });
      }

      alert('Business card created successfully.');
      router.push('/dashboard'); // Redirect to dashboard after creation
    } catch (error) {
      console.error('Error creating card:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div>
      <h2>Create New Business Card</h2>
      <BusinessCardForm onSuccess={handleCreateCard} />
    </div>
  );
};

export default ClientCardCreator;
