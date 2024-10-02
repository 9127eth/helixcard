import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface CreateCardIconProps {
  onClick: () => void;
}

export const CreateCardIcon: React.FC<CreateCardIconProps> = ({ onClick }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <button onClick={onClick} className="inline-flex items-center justify-center w-6 h-6 bg-[var(--primary)] text-[var(--primary-text)] rounded-full hover:bg-[var(--primary-hover)] dark:hover:bg-[#40444b] transition-colors ml-2">
      <span className="text-xl font-bold dark:text-[#323338]">+</span>
    </button>
  );
};