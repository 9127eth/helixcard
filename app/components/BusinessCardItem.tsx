import React from 'react';
import Link from 'next/link';

interface BusinessCard {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  // Add other relevant fields
}

interface BusinessCardItemProps {
  card: BusinessCard;
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({ card }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold">{card.name}</h3>
      <p className="text-gray-600">{card.jobTitle}</p>
      <p className="text-gray-600">{card.company}</p>
      <div className="mt-4">
        <Link href={`/edit-card/${card.id}`} className="text-indigo-600 hover:text-indigo-800 mr-4">
          Edit
        </Link>
        <Link href={`/view-card/${card.id}`} className="text-indigo-600 hover:text-indigo-800">
          View
        </Link>
      </div>
    </div>
  );
};
