import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export const CreateCardButton: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Link href="/create-card" className="flex flex-col items-center justify-center h-full bg-white text-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-[#FECAB9]">
      <div className="text-3xl mb-2">+</div>
      <div className="font-bold text-xl">Create New</div>
    </Link>
  );
};
