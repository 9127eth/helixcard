import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessCardItem } from './BusinessCardItem';

interface BusinessCard {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  // Add other relevant fields
}

interface BusinessCardListProps {
  userId: string;
}

export const BusinessCardList: React.FC<BusinessCardListProps> = ({ userId }) => {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      if (!db) {
        setError('Database not initialized');
        setIsLoading(false);
        return;
      }

      try {
        const q = query(collection(db as Firestore, 'users', userId, 'businessCards'));
        const querySnapshot = await getDocs(q);
        const fetchedCards = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as BusinessCard));
        setCards(fetchedCards);
      } catch (err) {
        console.error('Error fetching business cards:', err);
        setError('Failed to fetch business cards');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, [userId]);

  if (isLoading) {
    return <div>Loading your business cards...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (cards.length === 0) {
    return <div>You haven&apos;t created any business cards yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(card => (
        <BusinessCardItem 
          key={card.id} 
          card={{
            ...card,
            isPrimary: false, // Default value, adjust as needed
            cardSlug: card.id // Using id as cardSlug, adjust if you have a specific slug field
          }} 
        />
      ))}
    </div>
  );
};
