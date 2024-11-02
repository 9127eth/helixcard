import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessCardItem } from './BusinessCardItem';
import { CreateCardButton } from './CreateCardButton';
import { BusinessCard } from '@/app/types';
import PreviewModal from './PreviewModal';
import LoadingSpinner from './LoadingSpinner';

interface BusinessCardListProps {
  userId: string;
}

export const BusinessCardList: React.FC<BusinessCardListProps> = ({ userId }) => {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchCardsAndUsername = async () => {
      setIsLoading(true);
      try {
        if (!db) {
          throw new Error('Firestore instance is not initialized');
        }
        // Fetch cards (existing code)
        const cardsSnapshot = await getDocs(query(collection(db, 'users', userId, 'businessCards')));
        const fetchedCards = cardsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isActive: data.isActive === undefined ? true : data.isActive
          } as BusinessCard;
        });
        setCards(fetchedCards);

        // Fetch username
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCardsAndUsername();
  }, [userId]);

  const handleViewCard = (card: BusinessCard) => {
    setSelectedCard(card);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  const handleCardUpdate = (updatedCard: BusinessCard) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === updatedCard.id ? updatedCard : card
      )
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div className="flex justify-start">
      <div className={`max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 px-2 ${
        isPreviewOpen ? 'lg:w-2/3' : 'w-full'
      } transition-all duration-300`}>
        {cards.map((card) => (
          <div className="w-full max-w-[400px] mx-auto" key={card.id}>
            <BusinessCardItem
              card={card}
              onView={() => handleViewCard(card)}
              username={username}
              onUpdate={handleCardUpdate}
            />
          </div>
        ))}
        <div className="w-full max-w-[400px] mx-auto">
          <CreateCardButton />
        </div>
      </div>
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        card={selectedCard}
        username={username || ''}
      />
    </div>
  );
};
