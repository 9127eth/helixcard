'use client';

import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { saveBusinessCard, setPrimaryCard } from '../lib/firebaseOperations';

interface CardInfo {
  cardSlug: string;
  cardUrl: string;
}

const URLTest: React.FC = () => {
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const handleCreateCard = async () => {
    const user = auth?.currentUser;
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

      setCardInfo({ cardSlug, cardUrl });
      console.log('New card created with slug:', cardSlug);
      console.log('New card URL:', cardUrl);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };
  const handleSetPrimary = async () => {
    const user = auth?.currentUser;
    if (!user || !cardInfo) {
      console.error('User not authenticated or card info not available');
      return;
    }

    try {
      await setPrimaryCard(user.uid, cardInfo.cardSlug);
      console.log('Primary card set successfully');
    } catch (error) {
      console.error('Error setting primary card:', error);
    }
  };

  return (
    <div>
      <h2>URL Test</h2>
      <button onClick={handleCreateCard}>Create Test Card</button>
      {cardInfo && (
        <>
          <p>Card Slug: {cardInfo.cardSlug}</p>
          <p>Card URL: {cardInfo.cardUrl}</p>
          <button onClick={handleSetPrimary}>Set as Primary</button>
        </>
      )}
    </div>
  );
};

export default URLTest;

