import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessCardItem } from './BusinessCardItem';
import { CreateCardButton } from './CreateCardButton';
import { BusinessCard } from '@/app/types';

interface BusinessCardListProps {
  userId: string;
}

export const BusinessCardList: React.FC<BusinessCardListProps> = ({ userId }) => {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchCards = async () => {
      if (!db) {
        throw new Error('Firestore is not initialized.');
      }

      // Fetch the user document to get the username
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUsername(userDoc.data().username || '');
      }

      const q = query(collection(db, 'users', userId, 'businessCards'));
      const querySnapshot = await getDocs(q);
      const fetchedCards: BusinessCard[] = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as BusinessCard[];
      setCards(fetchedCards);
      setIsLoading(false);
    };

    fetchCards();
  }, [userId]);

  if (isLoading) {
    return <div>Loading your business cards...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
      {cards.map((card) => (
        <BusinessCardItem
          key={card.id}
          card={card}
          username={username}
        />
      ))}
      <CreateCardButton />
    </div>
  );
};
