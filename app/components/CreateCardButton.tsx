import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { canCreateCard } from '../lib/firebaseOperations';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FREE_USER_CARD_LIMIT, PRO_USER_CARD_LIMIT } from '../lib/constants';
import CardLimitModal from './CardLimitModal';
import { FiChevronRight, FiPlus } from 'react-icons/fi';

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
        className="group flex min-h-[82px] w-full items-center gap-4 rounded-[22px] border-2 border-dashed border-gray-300 bg-transparent px-4 py-3 text-left text-gray-800 transition hover:border-gray-400 hover:bg-white/60 focus:outline-none focus:ring-4 focus:ring-[#B8EB41]/25 dark:border-gray-600 dark:text-white dark:hover:border-gray-500 dark:hover:bg-white/5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B8EB41] text-gray-900 transition group-hover:scale-105">
          <FiPlus className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold leading-tight">Create a new card</span>
          <span className="mt-1 block text-sm leading-snug text-gray-500 dark:text-gray-400">
            A separate card for another role, business, or event
          </span>
        </span>
        <FiChevronRight
          className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
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
