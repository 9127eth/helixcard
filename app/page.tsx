'use client';

import React from 'react';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import WelcomeMessage from './components/WelcomeMessage';
import { AuthModal } from './components/AuthModal';
import DashboardPage from './dashboard/page';
import LoadingSpinner from './components/LoadingSpinner';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <DashboardPage />;
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="w-full md:w-1/2 p-4 md:p-8">
          <WelcomeMessage />
        </div>
        <div className="w-full md:w-1/2 p-4 md:p-8 flex items-center justify-center">
          <AuthModal />
        </div>
      </div>
    </Layout>
  );
}
