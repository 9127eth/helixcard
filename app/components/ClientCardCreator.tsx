'use client';

import React from 'react';
import { User } from 'firebase/auth';
import { saveBusinessCard } from '../lib/firebaseOperations';

interface ClientCardCreatorProps {
  user: User | null;
}

const ClientCardCreator: React.FC<ClientCardCreatorProps> = ({ user }) => {
  const handleCreateCard = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const cardData = {
        name: 'Test User',
        jobTitle: 'Developer',
        company: 'Test Company',
        phoneNumber: '123-456-7890',
        email: 'test@example.com',
        aboutMe: 'This is a test card',
        specialty: 'Testing',
        linkedIn: 'https://linkedin.com/in/testuser',
        twitter: 'https://twitter.com/testuser',
        customMessage: 'Hello, this is a test card!',
      };

      const { cardSlug, cardUrl } = await saveBusinessCard(user, cardData);
      console.log('New card created with slug:', cardSlug);
      console.log('New card URL:', cardUrl);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  return (
    <button onClick={handleCreateCard} className="bg-blue-500 text-white px-4 py-2 rounded">
      Create Test Card
    </button>
  );
};

export default ClientCardCreator;
