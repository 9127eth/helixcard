'use client';

import React from 'react';
import Layout from '../components/Layout';
import { BusinessCardForm } from '../components/BusinessCardForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { saveBusinessCard } from '../lib/firebaseOperations';

interface BusinessCardData {
  name: string;
  jobTitle: string;
  company: string;
  phoneNumber: string;
  email: string;
  aboutMe: string;
  linkedIn: string;
  twitter: string;
  customMessage: string;
  customSlug?: string;
  prefix: string;
  credentials: string;
  pronouns: string;
  facebookUrl: string;
  instagramUrl: string;
  profilePicture?: File;
  cv?: File;
}

const CreateCardPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handleSuccess = async (cardData: BusinessCardData) => {
    try {
      if (!user) {
        throw new Error('User is not authenticated');
      }
      const { cardSlug, cardUrl } = await saveBusinessCard(user, cardData);
      console.log('Business card created successfully');
      console.log('Card Slug:', cardSlug);
      console.log('Card URL:', cardUrl);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating business card:', error);
    }
  };

  return (
    <Layout title="Create Business Card - HelixCard">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create Your Business Card</h1>
        <BusinessCardForm onSuccess={handleSuccess} />
      </div>
    </Layout>
  );
};

export default CreateCardPage;
