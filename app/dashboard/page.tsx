'use client';

import React from 'react';
import Layout from '../components/Layout';
import { BusinessCardList } from '../components/BusinessCardList';
import { CreateCardButton } from '../components/CreateCardButton';
import { useAuth } from '../hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout title="Dashboard - HelixCard" showSidebar={true}>
      <div className="p-6"> {/* Added p-6 for padding on all sides */}
        <h1 className="text-2xl font-bold mb-6">Your Business Cards</h1>
        <CreateCardButton />
        <BusinessCardList userId={user.uid} />
      </div>
    </Layout>
  );
};

export default DashboardPage;
