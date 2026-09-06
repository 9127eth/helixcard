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
import { CARD_THEMES } from '../lib/cardThemes';
import { CARD_EFFECTS } from '../lib/cardEffects';

interface BusinessCardItemProps {
  card: BusinessCard;
  onView: () => void;
  username: string | null;
  onUpdate?: (updatedCard: BusinessCard) => void;
  onDelete?: (cardId: string) => void;
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({ card, onView, username, onUpdate, onDelete }) => {
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
      setIsActionLoading(true);
      try {
        const deleted = await handleCardDelete(user, card);
        if (deleted) {
          onDelete?.(card.id);
        }
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const showInactiveStatus = card.isActive === false;
  const theme = CARD_THEMES.find((option) => option.id === card.theme) || CARD_THEMES[0];
  const effect = CARD_EFFECTS.find((option) => option.id === card.effect);
  const fullName = [card.firstName, card.lastName].filter(Boolean).join(' ');
  const initials = [card.firstName, card.lastName]
    .filter(Boolean)
    .map((name) => name?.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
  const roleLine = [card.jobTitle, card.company].filter(Boolean).join(' · ');

  const handleColorChange = async (color: string) => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
    setIsActionLoading(true);
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
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="relative w-full pb-1 pr-1">
      {isActionLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[26px] bg-white/60 dark:bg-gray-900/60">
          <LoadingSpinner fullScreen={false} />
        </div>
      )}
      <div
        className="absolute bottom-0 left-1 right-0 top-1 rounded-[26px]"
        style={{ backgroundColor: currentColor }}
      />
      
      <article className="relative min-h-[184px] rounded-[26px] border border-gray-100 bg-[var(--card-grid-background)] p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/5">
        <div className="absolute right-3 top-3">
          <DropdownMenu
            options={[
              { label: 'Preview Card', icon: FiEye, onClick: onView },
              { label: 'Share', icon: FiShare, onClick: handleShareClick, disabled: !card.isActive },
              { label: 'Edit', icon: FiEdit, href: `/edit-card/${card.id}` },
              { label: 'Change Color', icon: BiPalette, onClick: () => setIsColorPickerOpen(true) },
              { label: 'Delete', icon: FiTrash2, onClick: handleDelete, danger: true },
            ]}
          />
        </div>
        <div className="pr-11">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-xl font-bold leading-tight text-gray-800 dark:text-white">
              {card.description}
            </h3>
            {card.isPrimary && (
              <span className="shrink-0 rounded-full bg-[#B8EB41] px-2 py-1 text-[11px] font-bold leading-none text-gray-900">
                Main
              </span>
            )}
            {showInactiveStatus && (
              <span className="shrink-0 rounded-full bg-[#FFE8D7] px-2 py-1 text-[11px] font-semibold leading-none text-[#F27A45] dark:bg-[#5a392d] dark:text-[#ffad88]">
                Inactive
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span
              className="h-3 w-5 shrink-0 rounded-full"
              style={{ background: theme.preview }}
              aria-hidden="true"
            />
            <span className="truncate">
              {[`${theme.name} design`, effect && effect.id !== 'none' ? effect.name : null]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
        </div>

        <div className="mt-4 flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFB18C] bg-cover bg-center text-base font-semibold text-gray-800"
            style={card.imageUrl ? { backgroundImage: `url(${card.imageUrl})` } : undefined}
            role={card.imageUrl ? 'img' : undefined}
            aria-label={card.imageUrl ? `${fullName} profile photo` : undefined}
          >
            {!card.imageUrl && initials}
          </div>
          <button
            type="button"
            onClick={card.isActive ? handleShareClick : undefined}
            disabled={!card.isActive}
            className={`min-w-0 text-left ${card.isActive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <span className="block truncate text-sm font-bold text-gray-800 dark:text-gray-100">
              {fullName}{card.credentials && <span className="font-medium">, {card.credentials}</span>}
            </span>
            {roleLine && (
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{roleLine}</span>
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleShareClick}
            disabled={!card.isActive}
            className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold transition ${
              card.isActive
                ? 'bg-[#B8EB41] text-gray-900 hover:bg-[#a9de31]'
                : 'cursor-not-allowed bg-[#dff5a8] text-gray-500 opacity-70 dark:bg-[#465234] dark:text-gray-400'
            }`}
          >
            <FiShare className="h-4 w-4" />
            Share
          </button>
          <Link href={`/edit-card/${card.id}`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-gray-100 text-sm font-semibold text-gray-800 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/15">
            <FiEdit className="h-4 w-4" />
            Edit
          </Link>
          <button onClick={onView} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-gray-100 text-sm font-semibold text-gray-800 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/15">
            <FiEye className="h-4 w-4" />
            View
          </button>
        </div>
      </article>
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
