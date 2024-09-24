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
        router.push('/dashboard');
      } catch (error) {
        console.error('Error updating business card:', error);
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
    return <Layout title="Edit Business Card - HelixCard"><div>Loading...</div></Layout>;
  }

  if (!cardData) {
    return <Layout title="Edit Business Card - HelixCard"><div>Card not found</div></Layout>;
  }

  return (
    <Layout title="Edit Business Card - HelixCard">
      <div className="flex flex-col">
        <div className="w-full pr-8">
          <h1 className="text-2xl font-bold mb-4">Edit Your Business Card</h1>
          <BusinessCardForm 
            initialData={cardData} 
            onSuccess={handleSuccess} 
            onDelete={handleDelete} 
          />
          <button
            onClick={handlePreviewToggle}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            {isPreviewOpen ? 'Close Preview' : 'Open Preview'}
          </button>
        </div>
        {cardData && cardUrl && (
          <PreviewModal
            isOpen={isPreviewOpen}
            onClose={handlePreviewToggle}
            card={{
              ...cardData,
              isPrimary: cardData.isPrimary || false,
              cardSlug: cardData.cardSlug || '',
            } as BusinessCard}
            username={username || ''}
          />
        )}
      </div>
    </Layout>
  );
}


