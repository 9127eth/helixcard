'use client';

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { BusinessCardList } from '../components/BusinessCardList';
import { CreateCardIcon } from '../components/smallcreatecardbutton';
import CardLimitModal from '../components/CardLimitModal';
import { useAuth } from '../hooks/useAuth';
import { canCreateCard } from '../lib/firebaseOperations';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FREE_USER_CARD_LIMIT, PRO_USER_CARD_LIMIT } from '../lib/constants';

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
    return <div>Loading...</div>;
  }

  return (
    <Layout title="Dashboard - HelixCard" showSidebar={true}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-xl font-bold">My Business Cards</h1>
          <CreateCardIcon onClick={handleCreateCard} />
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
