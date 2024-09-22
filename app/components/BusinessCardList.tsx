import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessCardItem } from './BusinessCardItem';
import { CreateCardButton } from './CreateCardButton';
import { BusinessCard } from '@/app/types';
import PreviewModal from './PreviewModal';

interface BusinessCardListProps {
  userId: string;
}

export const BusinessCardList: React.FC<BusinessCardListProps> = ({ userId }) => {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username] = useState('');
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      if (!db) {
        throw new Error('Firestore is not initialized.');
      }

      // Fetch the user document to get the username
      const userDoc = await getDoc(doc(db, 'users', userId));
      const username = userDoc.exists() ? userDoc.data().username : '';

      const q = query(collection(db, 'users', userId, 'businessCards'));
      const querySnapshot = await getDocs(q);
      const fetchedCards: BusinessCard[] = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        username // Add username to each card
      })) as BusinessCard[];
      setCards(fetchedCards);
      setIsLoading(false);
    };

    fetchCards();
  }, [userId]);

  const handleViewCard = (card: BusinessCard) => {
    setSelectedCard(card);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  if (isLoading) {
    return <div>Loading your business cards...</div>;
  }

  return (
    <div className="flex justify-start">
      <div className={`max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-6 px-2 ${isPreviewOpen ? 'lg:w-2/3' : 'w-full'} transition-all duration-300`}>
        {cards.map((card) => (
          <div className="w-full" key={card.id}>
            <BusinessCardItem
              card={card}
              onView={() => handleViewCard(card)}
            />
          </div>
        ))}
        <div className="w-full">
          <CreateCardButton />
        </div>
      </div>
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        card={selectedCard}
        username={username}
      />
    </div>
  );
};
