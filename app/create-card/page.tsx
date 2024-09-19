'use client';

import React from 'react';
import Layout from '../components/Layout';
import ClientCardCreator from '../components/ClientCardCreator';
import { useAuth } from '../hooks/useAuth';

const CreateCardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout title="Create Business Card - HelixCard">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create Your Business Card</h1>
        <ClientCardCreator user={user} />
      </div>
    </Layout>
  );
};

export default CreateCardPage;
