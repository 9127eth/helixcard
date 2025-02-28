'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { BusinessCardForm, BusinessCardData } from './BusinessCardForm';
import { saveBusinessCard, canCreateCard } from '../lib/firebaseOperations';
import { useRouter } from 'next/navigation';
import { generateCardSlug } from '../lib/slugUtils';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FREE_USER_CARD_LIMIT, PRO_USER_CARD_LIMIT } from '../lib/constants';

interface ClientCardCreatorProps {
  user: User | null;
  onClose: () => void;
  onCardDataChange?: (data: BusinessCardData, username: string) => void;
}

const ClientCardCreator: React.FC<ClientCardCreatorProps> = ({ 
  user, 
  onClose,
  onCardDataChange 
}) => {
  const router = useRouter();
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [limit, setLimit] = useState<number>(FREE_USER_CARD_LIMIT);

  useEffect(() => {
    const checkCanCreate = async () => {
      if (user) {
        try {
          const result = await canCreateCard(user.uid);
          setCanCreate(result);
          if (!result && db) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userIsPro = userDoc.data()?.isPro || false;
            setIsPro(userIsPro);
            setLimit(userIsPro ? PRO_USER_CARD_LIMIT : FREE_USER_CARD_LIMIT);
          }
        } catch (error) {
          console.error('Error checking if user can create card:', error);
          setCanCreate(false);
        }
      }
    };

    checkCanCreate();
  }, [user]);

  if (canCreate === null) {
    return <div>Loading...</div>;
  }

  if (canCreate === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Card Limit Reached</h2>
          <p className="mb-4">
            {isPro
              ? `You have reached the maximum limit of ${limit} cards. Please contact support to increase your limit.`
              : `Free users can only create ${limit} card. Upgrade to Pro to create more cards.`}
          </p>
          {!isPro && (
            <button 
              onClick={() => router.push('/get-helix-pro')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
            >
              Upgrade to Pro
            </button>
          )}
          <button 
            onClick={() => {
              onClose();
              router.push('/dashboard');
            }}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleCreateCard = async (cardData: BusinessCardData) => {
    if (!user) {
      alert('You must be logged in to create a card.');
      return;
    }

    try {
      if (!db) {
        throw new Error('Firestore database instance is not available.');
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();

      const isPro = userData?.isPro || false;
      const primaryCardPlaceholder = userData?.primaryCardPlaceholder || false;

      if (!primaryCardPlaceholder) {
        const canCreate = await canCreateCard(user.uid);
        if (!canCreate) {
          const limit = isPro ? PRO_USER_CARD_LIMIT : FREE_USER_CARD_LIMIT;
          if (isPro) {
            alert(`You have reached the maximum limit of ${limit} cards. Please contact support to increase your limit.`);
          } else {
            alert(`Free users can only create ${limit} card. Upgrade to Pro to create more.`);
          }
          return;
        }
      }

      let cardSlug = generateCardSlug();
      if (primaryCardPlaceholder) {
        if (!userData?.username) {
          throw new Error('Username not found for user');
        }
        cardSlug = userData.username;
      }

      const updatedCardData = {
        ...cardData,
        cardSlug,
        isPrimary: primaryCardPlaceholder,
        isActive: primaryCardPlaceholder || isPro,
        name: `${cardData.firstName}${cardData.lastName ? ' ' + cardData.lastName : ''}`.trim(),
        lastName: cardData.lastName || '',
      };

      const { cardSlug: returnedCardSlug } = await saveBusinessCard(user, {
        ...updatedCardData,
        email: cardData.email || '',
      });

      if (primaryCardPlaceholder) {
        await updateDoc(userDocRef, {
          primaryCardId: returnedCardSlug,
          primaryCardPlaceholder: false,
        });
      }

      alert('Business card created successfully.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating card:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const handleFormChange = (formData: BusinessCardData) => {
    if (onCardDataChange && user) {
      // Get the username from the user document
      const getUsernameAndUpdatePreview = async () => {
        try {
          if (db) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const username = userDoc.data()?.username || '';
            
            // Create a preview-compatible object
            const previewData = {
              ...formData,
              id: 'preview',
              isPrimary: false,
              cardSlug: generateCardSlug(),
              isActive: true,
              lastName: formData.lastName || '',
              email: formData.email || '',
            };
            
            onCardDataChange(previewData, username);
          }
        } catch (error) {
          console.error('Error getting username for preview:', error);
        }
      };
      
      getUsernameAndUpdatePreview();
    }
  };

  return (
    <BusinessCardForm
      onSuccess={handleCreateCard}
      isEditing={false}  // Explicitly set this for clarity
      onChange={handleFormChange}
    />
  );
};

export default ClientCardCreator;