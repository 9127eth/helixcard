import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { canCreateCard } from '../lib/firebaseOperations';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FREE_USER_CARD_LIMIT, PRO_USER_CARD_LIMIT } from '../lib/constants';
import CardLimitModal from './CardLimitModal';

export const CreateCardButton: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [limit, setLimit] = useState(FREE_USER_CARD_LIMIT);

  const handleClick = async () => {
    if (user) {
      try {
        const result = await canCreateCard(user.uid);
        if (!result && db) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userIsPro = userDoc.data()?.isPro || false;
          setIsPro(userIsPro);
          setLimit(userIsPro ? PRO_USER_CARD_LIMIT : FREE_USER_CARD_LIMIT);
          setShowLimitModal(true);
        } else {
          router.push('/create-card');
        }
      } catch (error) {
        console.error('Error checking if user can create card:', error);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full bg-[var(--card-grid-background)] text-[var(--foreground)] rounded-lg shadow-sm hover:shadow-md transition-shadow border-2 border-[#FECAB9] flex flex-col items-center justify-center p-4 h-[180px] hover:bg-[var(--primary-hover)] dark:hover:bg-[#40444b]"
      >
        <div className="text-3xl mb-2">+</div>
        <div className="font-bold text-xl">Create New</div>
      </button>
      {showLimitModal && (
        <CardLimitModal
          isPro={isPro}
          limit={limit}
          onClose={() => setShowLimitModal(false)}
        />
      )}
    </>
  );
};
