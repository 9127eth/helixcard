import React, { useState } from 'react';
import Link from 'next/link';
import { FiShare, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { BiPalette } from 'react-icons/bi';
import { BusinessCard } from '@/app/types';
import { ShareModal } from './ShareModal';
import DropdownMenu from './DropdownMenu';
import { handleCardDelete } from '../lib/cardOperations';
import { useAuth } from '../hooks/useAuth';
import { updateCardDepthColor } from '../lib/firebaseOperations';
import ColorPickerDialog from './ColorPickerDialog';
import LoadingSpinner from './LoadingSpinner';

interface BusinessCardItemProps {
  card: BusinessCard;
  onView: () => void;
  username: string | null;
  onUpdate?: (updatedCard: BusinessCard) => void;
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({ card, onView, username, onUpdate }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { user } = useAuth();
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(card.cardDepthColor || '#7CCEDA'); // Default color
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  const handleColorChange = async (color: string) => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
    try {
      await updateCardDepthColor(user.uid, card.cardSlug, color);
      setCurrentColor(color);
      // Create updated card object with new color
      const updatedCard = {
        ...card,
        cardDepthColor: color
      };
      // Call the onUpdate prop with the updated card
      onUpdate?.(updatedCard);
    } catch (error) {
      console.error('Error updating card depth color:', error);
    }
  };

  const handleAction = async () => {
    setIsActionLoading(true);
    try {
      // Perform action
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      {isActionLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner fullScreen={false} />
        </div>
      )}
      {/* Background layer for depth effect */}
      <div 
        className="absolute top-2 left-2 w-full h-[220px] rounded-2xl" 
        style={{ backgroundColor: currentColor }}
      />
      
      {/* Main card content */}
      <div className="relative bg-card-grid-background border rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col p-4 h-[220px]">
        <div className="absolute top-2 right-2">
          <DropdownMenu
            options={[
              { label: 'Preview', icon: FiEye, onClick: onView },
              { label: 'Share', icon: FiShare, onClick: handleShareClick, disabled: !card.isActive },
              { label: 'Edit', icon: FiEdit, href: `/edit-card/${card.id}` },
              { label: 'Change Color', icon: BiPalette, onClick: () => setIsColorPickerOpen(true) },
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
          <p className="text-sm text-gray-600 dark:text-[var(--card-grid-secondary-text)] truncate">
            <span className="font-bold">{`${card.firstName} ${card.lastName}`}</span>
            {card.credentials && <span>, {card.credentials}</span>}
          </p>
          <p className="text-sm text-gray-600 dark:text-[var(--card-grid-secondary-text)] truncate">{card.jobTitle}</p>
          <p className="text-sm text-gray-600 dark:text-[var(--card-grid-secondary-text)] truncate">{card.company}</p>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {card.isPrimary && (
              <div className="group relative">
                <span className="text-xs text-gray-500 dark:text-gray-400 italic p-1">
                  Main
                </span>
                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full mb-1 left-0 whitespace-nowrap">
                  This is your main card
                </span>
              </div>
            )}
            {showInactiveStatus && (
              <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded group relative">
                Inactive
                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full mb-1 left-0 whitespace-nowrap">
                  Get Pro to re-activate
                </span>
              </div>
            )}
          </div>
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
      </div>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        businessCard={card}
        username={username}
      />
      <ColorPickerDialog
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        currentColor={currentColor}
        onColorChange={handleColorChange}
      />
    </div>
  );
};
