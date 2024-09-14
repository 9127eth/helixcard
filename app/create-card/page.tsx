'use client';

import React from 'react';
import Layout from '../components/Layout';
import { BusinessCardForm } from '../components/BusinessCardForm';
import { useRouter } from 'next/navigation';

const CreateCardPage: React.FC = () => {
  const router = useRouter();

  const handleSuccess = () => {
    console.log('Business card created successfully');
    router.push('/dashboard');
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
