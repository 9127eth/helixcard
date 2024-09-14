import React, { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
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

  useEffect(() => {
    const fetchCards = async () => {
      const q = query(collection(db, 'users', userId, 'businessCards'));
      const querySnapshot = await getDocs(q);
      const fetchedCards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BusinessCard));
      setCards(fetchedCards);
      setIsLoading(false);
    };

    fetchCards();
  }, [userId]);

  if (isLoading) {
    return <div>Loading your business cards...</div>;
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
