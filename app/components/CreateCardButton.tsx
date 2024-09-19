import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export const CreateCardButton: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Link href="/create-card" className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors mb-4 font-bold">
      Create New Card
    </Link>
  );
};
