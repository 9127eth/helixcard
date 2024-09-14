'use client';

import React from 'react';
import Layout from './components/Layout';
import WelcomeMessage from './components/WelcomeMessage';
import { AuthModal } from './components/AuthModal';


export default function Home() {

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
