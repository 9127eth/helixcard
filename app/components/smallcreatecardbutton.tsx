import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export const CreateCardIcon: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Link href="/create-card" className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors ml-2">
      <span className="text-xl font-bold">+</span>
    </Link>
  );
};
