import React, { useState } from 'react';
import Link from 'next/link';
import { FiShare, FiEdit, FiEye, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi';
import { BusinessCard } from '@/app/types';
import { ShareModal } from './ShareModal';
import DropdownMenu from './DropdownMenu';
import { handleCardDelete } from '../lib/cardOperations';
import { useAuth } from '../hooks/useAuth';

interface BusinessCardItemProps {
  card: BusinessCard;
  onView: () => void;
  username: string | null;
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({ card, onView, username }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { user } = useAuth();

  const handleShareClick = () => {
    if (!card.isActive) return;
    setIsShareModalOpen(true);
  };

  const handleDelete = async () => {
    if (user) {
      const deleted = await handleCardDelete(user, card);
      if (deleted) {
        // Refresh the card list or remove the card from the UI
        // You might need to implement this functionality in the parent component
      }
    }
  };

  const showInactiveStatus = card.isActive === false;

  return (
    <div className="w-full bg-card-grid-background border rounded-lg shadow-sm hover:shadow-md transition-shadow relative flex flex-col p-4 h-[180px]">
      <div className="absolute top-2 right-2">
        <DropdownMenu
          options={[
            { label: 'Preview', icon: FiEye, onClick: onView },
            { label: 'Share', icon: FiShare, onClick: handleShareClick, disabled: !card.isActive },
            { label: 'Edit', icon: FiEdit, href: `/edit-card/${card.id}` },
            { label: 'Delete', icon: FiTrash2, onClick: handleDelete, danger: true },
          ]}
        />
      </div>
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
      {showInactiveStatus && (
        <div className="absolute bottom-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded group">
          Inactive
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-2 whitespace-nowrap">
            Get Pro to re-activate
          </span>
        </div>
      )}
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
      {card.isPrimary && (
        <div className="absolute bottom-2 right-2 group">
          <span className="text-xs text-gray-500 dark:text-gray-400 italic p-1">
            Main
          </span>
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-2 whitespace-nowrap">
            This is your main card
          </span>
        </div>
      )}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        businessCard={card}
        username={username}
      />
    </div>
  );
};