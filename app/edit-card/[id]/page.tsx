'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import { BusinessCardForm } from '../../components/BusinessCardForm';
import PreviewModal from '../../components/PreviewModal'; // Add this import
import { getBusinessCard, updateBusinessCard, deleteBusinessCard } from '../../lib/firebaseOperations';
import { BusinessCard, BusinessCardData } from '@/app/types';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { db } from '../../lib/firebase'; // Import Firestore database
import LoadingSpinner from '../../components/LoadingSpinner';


export default function EditCardPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [cardData, setCardData] = useState<BusinessCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Add this state
  const [username, setUsername] = useState<string | null>(null); // Add this state

  useEffect(() => {
    const fetchCardData = async () => {
      if (user && params.id) {
        try {
          const card = await getBusinessCard(user.uid, params.id);
          setCardData({ ...card, id: params.id } as BusinessCardData);
          
          // Fetch the user's username
          if (db) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUsername(userData.username);
            }
          } else {
            console.error('Firestore database is not initialized');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setCardData(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCardData();
  }, [user, params.id]);

  const handleSuccess = async (updatedCardData: BusinessCardData) => {
    if (user && params.id) {
      try {
        await updateBusinessCard(user.uid, params.id, updatedCardData);
        // Show a success message
        alert('Business card updated successfully.');
      } catch (error) {
        console.error('Error updating business card:', error);
        alert('Failed to update business card. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    if (user && params.id) {
      try {
        await deleteBusinessCard(user, params.id);
        alert('Business card deleted successfully.');
        router.push('/dashboard');
      } catch (error) {
        console.error('Error deleting business card:', error);
        alert('Failed to delete business card. Please try again.');
      }
    }
  };

  const handlePreviewToggle = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  // Construct the card URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.helixcard.app';
  const cardUrl = cardData && username
    ? (cardData.isPrimary 
        ? `${baseUrl}/c/${username}`
        : `${baseUrl}/c/${username}/${cardData.cardSlug}`)
    : null;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!cardData) {
    return <Layout title="Edit Business Card - HelixCard"><div>Card not found</div></Layout>;
  }

  return (
    <Layout title="Edit Business Card - HelixCard">
      <div className="relative p-6 pb-12">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-3/5 md:pr-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold">Edit Card</h1>
            </div>
            <BusinessCardForm 
              initialData={cardData} 
              onSuccess={handleSuccess} 
              onDelete={handleDelete}
              isEditing={true}
            />
            <div className="mt-6 pl-1">
              <button
                onClick={handlePreviewToggle}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
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
          </div>
          <div className="hidden md:block md:w-2/5">
            {/* This div is intentionally left empty for larger screens */}
          </div>
        </div>
        {cardData && cardUrl && (
          <div className="md:hidden">
            <PreviewModal
              isOpen={isPreviewOpen}
              onClose={handlePreviewToggle}
              card={{
                ...cardData,
                isPrimary: cardData.isPrimary || false,
                cardSlug: cardData.cardSlug || '',
                lastName: cardData.lastName || '',
                email: cardData.email || '',
              } as BusinessCard}
              username={username || ''}
            />
          </div>
        )}
        {cardData && cardUrl && (
          <div className="hidden md:block absolute top-0 right-0 h-full">
            <PreviewModal
              isOpen={isPreviewOpen}
              onClose={handlePreviewToggle}
              card={{
                ...cardData,
                isPrimary: cardData.isPrimary || false,
                cardSlug: cardData.cardSlug || '',
                lastName: cardData.lastName || '',
                email: cardData.email || '',
              } as BusinessCard}
              username={username || ''}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}



