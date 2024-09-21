'use client';

import React from 'react';
import Layout from '../components/Layout';
import { BusinessCardList } from '../components/BusinessCardList';
import { CreateCardButton } from '../components/CreateCardButton';
import { CreateCardIcon } from '../components/smallcreatecardbutton';
import { useAuth } from '../hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout title="Dashboard - HelixCard" showSidebar={true}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Your Business Cards</h1>
          <CreateCardIcon />
        </div>
        <BusinessCardList userId={user.uid} />
      </div>
    </Layout>
  );
};

export default DashboardPage;
