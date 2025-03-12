'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BusinessCardList } from '../components/BusinessCardList';
import CardLimitModal from '../components/CardLimitModal';
import { useAuth } from '../hooks/useAuth';
import { canCreateCard } from '../lib/firebaseOperations';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FREE_USER_CARD_LIMIT, PRO_USER_CARD_LIMIT } from '../lib/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { FaWallet, FaMagic, FaIdCard } from 'react-icons/fa';
import { Smartphone } from 'react-feather';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [limit, setLimit] = useState(FREE_USER_CARD_LIMIT);
  const [hasCards, setHasCards] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUserCards = async () => {
      if (user && db) {
        try {
          // Check if user has any cards
          const cardsSnapshot = await getDocs(collection(db, 'users', user.uid, 'businessCards'));
          setHasCards(cardsSnapshot.size > 0);
          
          // We don't need to check if this is their first login anymore
          // since we removed the isFirstLogin state
        } catch (error) {
          console.error('Error checking user cards:', error);
          setHasCards(false);
        }
      }
    };

    if (user) {
      checkUserCards();
    }
  }, [user]);

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
        {hasCards === false && (
          <div className="mb-12 bg-gradient-to-b from-[#F5FDFD] to-white dark:from-gray-900 dark:to-gray-800 rounded-xl p-8 shadow-sm">
            <div className="flex flex-col">
              <div className="w-full mb-8">
                <div className="mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-white">
                    Welcome to <span className="text-[#7CCEDA] dark:text-[#7CCEDA]">Helix</span>!
                  </h1>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                    We&apos;re excited to have you join us on your journey to better networking. Let&apos;s get started by creating your first digital business card.
                  </p>
                  <button
                    onClick={handleCreateCard}
                    className="px-6 py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg flex items-center justify-center transition-colors duration-300 mb-6"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Your First Card
                  </button>
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">What you can do with Helix:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  <div className="flex items-start">
                    <div className="bg-[#7CCEDA] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <FaIdCard className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Create Digital Cards</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Design beautiful digital business cards that represent you professionally.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#B8EB41] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <Smartphone className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Add to Digital Wallet</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Add your card to Apple Wallet for easy access. (Google Pay coming soon!)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#FC9A99] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <FaWallet className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-1">NFC Integration</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Connect your card to NFC devices for tap-to-share functionality.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#7CCEDA] dark:bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <FaMagic className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-1">AI Card Scanning</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Try our AI-powered mobile business card scanner to digitize your contacts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full flex justify-center px-4 py-6">
                <div className="relative w-full max-w-2xl">
                  <div className="absolute -top-4 -left-4 w-full h-full bg-[#B8EB41] rounded-xl transform rotate-3"></div>
                  <div className="absolute -bottom-4 -right-4 w-full h-full bg-[#FC9A99] rounded-xl transform -rotate-3"></div>
                  <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <Image
                      src="/helix-phone.png"
                      alt="Helix Phone"
                      width={1200}
                      height={750}
                      className="w-full h-auto rounded-lg"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center mb-6">
          <h1 className="text-6xl font-bold">Business Cards</h1>
          {hasCards && (
            <div className="pl-4">
              <button
                onClick={handleCreateCard}
                className="flex items-center justify-center gap-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] font-medium py-1.5 px-3 rounded-md text-sm transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4" />
                <span>New Card</span>
              </button>
            </div>
          )}
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
