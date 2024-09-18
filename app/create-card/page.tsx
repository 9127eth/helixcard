'use client';

import React from 'react';
import Layout from '../components/Layout';
import { BusinessCardForm } from '../components/BusinessCardForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

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
    if (user) {
      // Here you would typically save the card data
      console.log('Saving card data:', cardData);
      // After saving, redirect to the dashboard
      router.push('/dashboard');
    } else {
      console.error('User not authenticated');
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
