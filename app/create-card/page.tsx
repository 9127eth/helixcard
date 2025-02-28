'use client';

import React, { useState } from 'react';
import Layout from '../components/Layout';
import ClientCardCreator from '../components/ClientCardCreator';
import { useAuth } from '../hooks/useAuth';
import PreviewModal from '../components/PreviewModal';
import { BusinessCard } from '../types';
import { BusinessCardData } from '../components/BusinessCardForm';

const CreateCardPage: React.FC = () => {
  const { user } = useAuth();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [cardData, setCardData] = useState<BusinessCard | null>(null);
  const [username, setUsername] = useState<string>('');

  const handlePreviewToggle = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  const handleCardDataChange = (data: BusinessCardData, username: string) => {
    setCardData(data as BusinessCard);
    setUsername(username);
  };

  return (
    <Layout title="Create Business Card - HelixCard">
      <div className="flex flex-col md:flex-row p-6 pb-12"> {/* Added padding here */}
        <div className="w-full md:w-3/5 md:pr-8">
          <h1 className="text-3xl font-bold mb-4">Create New Card</h1>
          <ClientCardCreator 
            user={user} 
            onClose={() => {}} 
            onCardDataChange={handleCardDataChange}
          />
          {cardData && (
            <div className="mt-6 pl-1">
              <button
                onClick={handlePreviewToggle}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                disabled={!cardData}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Preview Your Card
              </button>
            </div>
          )}
        </div>
        <div className="hidden md:block md:w-2/5 bg-background"></div>
      </div>
      {cardData && (
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={handlePreviewToggle}
          card={cardData}
          username={username}
        />
      )}
    </Layout>
  );
};

export default CreateCardPage;
