import React from 'react';
import Link from 'next/link';

interface BusinessCard {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  isPrimary: boolean;
  cardSlug: string;
}

interface BusinessCardItemProps {
  card: BusinessCard;
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({ card }) => {
  return (
    <div className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${card.isPrimary ? 'border-blue-500' : ''}`}>
      <h3 className="text-xl font-semibold">{card.name}</h3>
      <p className="text-gray-600">{card.jobTitle}</p>
      <p className="text-gray-600">{card.company}</p>
      {card.isPrimary && (
        <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-full mt-2">Primary</span>
      )}
      <div className="mt-4">
        <Link href={`/edit-card/${card.id}`} className="text-indigo-600 hover:text-indigo-800 mr-4">
          Edit
        </Link>
        <Link href={`/view-card/${card.id}`} className="text-indigo-600 hover:text-indigo-800">
          View
        </Link>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        URL: https://www.helixcard.app/c/{card.cardSlug}
      </p>
    </div>
  );
};
