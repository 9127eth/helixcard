import React, { useState } from 'react';
import Link from 'next/link';
import { FiShare, FiEdit, FiEye } from 'react-icons/fi';
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
    if (!card.isActive) return;
    setIsShareModalOpen(true);
  };

  const showInactiveStatus = card.isActive === false;

  return (
    <div className="w-full bg-card-grid-background border rounded-lg shadow-sm hover:shadow-md transition-shadow relative flex flex-col p-4 h-[180px]">
      {card.isPrimary && (
        <div className="absolute top-2 right-2 group">
          <svg className="h-3 w-3 text-[var(--foreground)]" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="6" />
          </svg>
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-2 whitespace-nowrap">
            Primary card
          </span>
        </div>
      )}
      {showInactiveStatus && (
        <div className="absolute top-0 right-0 bg-gray-500 text-white text-xs px-2 py-1 rounded-bl group">
          Inactive
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-2 whitespace-nowrap">
            Get Pro to re-activate
          </span>
        </div>
      )}
      <div
        className={`flex-grow overflow-hidden ${
          card.isActive ? 'cursor-pointer' : 'cursor-default'
        }`}
        onClick={card.isActive ? handleShareClick : undefined}
      >
        <h3 className="text-3xl font-semibold mb-2 line-clamp-1 overflow-hidden">
          {card.description}
        </h3>
        <p className="text-sm text-gray-600 dark:text-[var(--card-grid-secondary-text)] truncate">{card.jobTitle}</p>
        <p className="text-sm text-gray-600 dark:text-[var(--card-grid-secondary-text)] truncate">{card.company}</p>
      </div>
      <div className="mt-auto">
        <div className="flex space-x-3">
          <Link href={`/edit-card/${card.id}`} className="card-grid-icon-button group relative">
            <FiEdit className="text-[var(--card-grid-icon-button-text)]" />
            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              Edit
            </span>
          </Link>
          <button onClick={onView} className="card-grid-icon-button group relative">
            <FiEye className="text-[var(--card-grid-icon-button-text)]" />
            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              Preview
            </span>
          </button>
          <button
            onClick={handleShareClick}
            className={`card-grid-icon-button group relative ${
              !card.isActive ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!card.isActive}
          >
            <FiShare className="text-[var(--card-grid-icon-button-text)]" />
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