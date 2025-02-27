'use client';

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { BusinessCardList } from '../components/BusinessCardList';
import CardLimitModal from '../components/CardLimitModal';
import { useAuth } from '../hooks/useAuth';
import { canCreateCard } from '../lib/firebaseOperations';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FREE_USER_CARD_LIMIT, PRO_USER_CARD_LIMIT } from '../lib/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusIcon } from '@heroicons/react/24/solid';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [limit, setLimit] = useState(FREE_USER_CARD_LIMIT);

  const handleCreateCard = async () => {
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
          // Redirect to create card page or open create card modal
          window.location.href = '/create-card';
        }
      } catch (error) {
        console.error('Error checking if user can create card:', error);
      }
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <Layout title="Dashboard - HelixCard" showSidebar={true}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-6xl font-bold">Business Cards</h1>
          <div className="pl-4">
            <button
              onClick={handleCreateCard}
              className="flex items-center justify-center gap-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] font-medium py-1.5 px-3 rounded-md text-sm transition-colors duration-200"
            >
              <PlusIcon className="h-4 w-4" />
              <span>New Card</span>
            </button>
          </div>
        </div>
        <BusinessCardList userId={user.uid} />
      </div>
      {showLimitModal && (
        <CardLimitModal
          isPro={isPro}
          limit={limit}
          onClose={() => setShowLimitModal(false)}
        />
      )}
    </Layout>
  );
};

export default DashboardPage;
