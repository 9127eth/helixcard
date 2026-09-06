'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'react-feather';
import Layout from '../components/Layout';
import ClientCardCreator from '../components/ClientCardCreator';
import { useAuth } from '../hooks/useAuth';

const CreateCardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout title="Create Business Card - HelixCard">
      <div className="px-4 pb-16 pt-2 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft size={15} />
              My cards
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Create new card</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Fill in the details and watch your card come together in the live preview.
            </p>
          </div>
          <ClientCardCreator
            user={user}
            onClose={() => {}}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CreateCardPage;
