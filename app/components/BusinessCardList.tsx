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
        const [cardsSnapshot, userDoc] = await Promise.all([
          getDocs(query(collection(db, 'users', userId, 'businessCards'))),
          getDoc(doc(db, 'users', userId)),
        ]);
        const isPro = userDoc.data()?.isPro === true;
        const fetchedCards = cardsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isActive: data.isActive === undefined ? true : data.isActive,
            isPro,
          } as BusinessCard;
        });
        setCards(fetchedCards);

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

  const handleCardDelete = (deletedCardId: string) => {
    setCards(prevCards => prevCards.filter(card => card.id !== deletedCardId));
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div className="flex justify-start">
      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
        {cards.map((card) => (
          <div className="mx-auto w-full max-w-[420px]" key={card.id}>
            <BusinessCardItem
              card={card}
              onView={() => handleViewCard(card)}
              username={username}
              onUpdate={handleCardUpdate}
              onDelete={handleCardDelete}
            />
          </div>
        ))}
        <div className="mx-auto w-full max-w-[420px]">
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
