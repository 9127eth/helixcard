import React, { useState } from 'react';
import Link from 'next/link';
import { FaStar, FaEdit, FaEye, FaShareAlt } from 'react-icons/fa';
import { BusinessCard } from '@/app/types';
import { ShareModal } from './ShareModal';

interface BusinessCardItemProps {
  card: BusinessCard;
  onView: () => void;
  username: string | null;
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({ card, onView, username }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  return (
    <div className="w-full bg-card-grid-background border rounded-lg shadow-sm hover:shadow-md transition-shadow relative flex flex-col p-4 h-[180px]">
      {card.isPrimary && (
        <div className="absolute top-2 right-2 group">
          <FaStar className="h-3 w-3 text-black" />
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-2 whitespace-nowrap">
            Primary card
          </span>
        </div>
      )}
      <div className="flex-grow overflow-hidden cursor-pointer" onClick={handleShareClick}>
        <h3 className="text-3xl font-semibold mb-2 line-clamp-1 overflow-hidden">
          {card.description}
        </h3>
        <p className="text-sm text-gray-600 truncate">{card.jobTitle}</p>
        <p className="text-sm text-gray-600 truncate">{card.company}</p>
      </div>
      <div className="mt-auto">
        <div className="flex space-x-2">
          <Link href={`/edit-card/${card.id}`} className="card-grid-icon-button group relative">
            <FaEdit className="text-[var(--card-grid-icon-button-text)]" />
            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              Edit
            </span>
          </Link>
          <button onClick={onView} className="card-grid-icon-button group relative">
            <FaEye className="text-[var(--card-grid-icon-button-text)]" />
            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              Preview
            </span>
          </button>
          <button onClick={handleShareClick} className="card-grid-icon-button group relative">
            <FaShareAlt className="text-[var(--card-grid-icon-button-text)]" />
            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              Share this card
            </span>
          </button>
        </div>
      </div>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        businessCard={card}
        username={username}
      />
    </div>
  );
};