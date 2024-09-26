'use client';

import React from 'react';
import Layout from '../components/Layout';
import ClientCardCreator from '../components/ClientCardCreator';
import { useAuth } from '../hooks/useAuth';

const CreateCardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout title="Create Business Card - HelixCard">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-3/5 md:pr-8">
          <h1 className="text-2xl font-bold mb-4">Create Your Business Card</h1>
          <ClientCardCreator user={user} />
        </div>
        <div className="hidden md:block md:w-2/5 bg-background"></div>
      </div>
    </Layout>
  );
};

export default CreateCardPage;
