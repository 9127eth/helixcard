'use client';

import React from 'react';
import { User } from 'firebase/auth';
import { BusinessCardForm, BusinessCardData } from './BusinessCardForm';
import { saveBusinessCard } from '../lib/firebaseOperations';
import { useRouter } from 'next/navigation';
import { generateCardSlug } from '../lib/slugUtils';

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
      const cardSlug = generateCardSlug(); // Implement this function to generate a unique slug
      const updatedCardData = {
        ...cardData,
        cardSlug,
        isPrimary: false, // Set this based on your business logic
      };
      const { cardSlug: returnedCardSlug, cardUrl } = await saveBusinessCard(user, updatedCardData);
      alert('Business card created successfully.');
      console.log('New card created with slug:', returnedCardSlug);
      console.log('New card URL:', cardUrl);
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
