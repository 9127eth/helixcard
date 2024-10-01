import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export const CreateCardIcon: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Link href="/create-card" className="inline-flex items-center justify-center w-6 h-6 bg-[var(--primary)] text-[var(--primary-text)] rounded-full hover:bg-[var(--primary-hover)] hover:text-[var(--primary-text-hover)] transition-colors ml-2">
      <span className="text-xl font-bold dark:text-[#323338]">+</span>
    </Link>
  );
};
