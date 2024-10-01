import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export const CreateCardButton: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Link href="/create-card" className="w-full bg-[var(--card-grid-background)] text-[var(--foreground)] rounded-lg shadow-sm hover:shadow-md transition-shadow border-2 border-[#FECAB9] flex flex-col items-center justify-center p-4 h-[180px]">
      <div className="text-3xl mb-2">+</div>
      <div className="font-bold text-xl">Create New</div>
    </Link>
  );
};
