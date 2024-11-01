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
      <div className="w-full relative">
        {/* Background layer for depth effect */}
        <div 
          className="absolute top-2 left-2 w-full h-[220px] rounded-2xl" 
          style={{ backgroundColor: '#d1d5dc' }}
        />
        
        {/* Main button content */}
        <button
          onClick={handleClick}
          className="relative w-full bg-[var(--card-grid-background)] text-[var(--foreground)] rounded-2xl shadow-sm hover:shadow-md transition-shadow border flex flex-col items-center justify-center p-4 h-[220px] hover:bg-[var(--primary-hover)] dark:hover:bg-[#40444b]"
        >
          <div className="flex items-center space-x-2">
            <span className="text-3xl">+</span>
            <span className="font-bold text-xl">Create New</span>
          </div>
        </button>
      </div>
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
