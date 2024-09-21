'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import { BusinessCardForm } from '../../components/BusinessCardForm';
import BusinessCardDisplay from '../../components/BusinessCardDisplay'; // Changed this line
import { getBusinessCard, updateBusinessCard } from '../../lib/firebaseOperations';
import { BusinessCard, BusinessCardData } from '@/app/types';

export default function EditCardPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [cardData, setCardData] = useState<BusinessCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCardData = async () => {
      if (user && params.id) {
        try {
          const card = await getBusinessCard(user.uid, params.id);
          setCardData({ ...card, id: params.id } as BusinessCardData);
        } catch (error) {
          console.error('Error fetching card data:', error);
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

  if (isLoading) {
    return <Layout title="Edit Business Card - HelixCard"><div>Loading...</div></Layout>;
  }

  if (!cardData) {
    return <Layout title="Edit Business Card - HelixCard"><div>Card not found</div></Layout>;
  }

  return (
    <Layout title="Edit Business Card - HelixCard">
      <div className="flex">
        <div className="w-2/3 pr-8">
          <h1 className="text-2xl font-bold mb-4">Edit Your Business Card</h1>
          <BusinessCardForm initialData={cardData} onSuccess={handleSuccess} />
        </div>
        <div className="w-1/3">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          {cardData && <BusinessCardDisplay card={cardData as BusinessCard} />}
        </div>
      </div>
    </Layout>
  );
}


