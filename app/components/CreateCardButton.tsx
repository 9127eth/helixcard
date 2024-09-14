import React from 'react';
import Link from 'next/link';

export const CreateCardButton: React.FC = () => {
  return (
    <Link href="/create-card" className="inline-block mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
      Create New Business Card
    </Link>
  );
};
