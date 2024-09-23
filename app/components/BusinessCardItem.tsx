import React, { useState } from 'react';
import Link from 'next/link';
import { FaStar, FaShare } from 'react-icons/fa';
import { BusinessCard } from '@/app/types';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { deleteBusinessCard } from '../lib/firebaseOperations';
import { ShareModal } from './ShareModal';

interface BusinessCardItemProps {
  card: BusinessCard;
  onView: () => void;
  username: string | null; // Add this line
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({ card, onView, username }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!user) {
      alert('You must be logged in to delete a card.');
      return;
    }

    const confirmDelete = confirm('Are you sure you want to delete this business card?');
    if (!confirmDelete) return;

    try {
      await deleteBusinessCard(user, card.cardSlug);
      alert('Business card deleted successfully.');
      router.refresh();
    } catch (error: unknown) {
      console.error('Error deleting business card:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative h-48 flex flex-col justify-between">
      {card.isPrimary && (
        <div className="absolute top-2 right-2 group">
          <FaStar className="h-3 w-3 text-black" />
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-2 whitespace-nowrap">
            Primary card
          </span>
        </div>
      )}
      <div>
        <h3 className="text-3xl font-semibold mb-2 line-clamp-2 overflow-hidden">
          {card.description}
        </h3>
        <p className="text-sm text-gray-600">{card.jobTitle}</p>
        <p className="text-sm text-gray-600">{card.company}</p>
        {card.webLinks && card.webLinks.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Web Links: {card.webLinks.length}</p>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-4">
        <div>
          <Link href={`/edit-card/${card.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 mr-3">
            Edit
          </Link>
          <button onClick={onView} className="text-sm text-indigo-600 hover:text-indigo-800 mr-3">
            Preview
          </button>
          <button onClick={() => setIsShareModalOpen(true)} className="text-sm text-indigo-600 hover:text-indigo-800">
            <FaShare className="inline mr-1" />
            Share
          </button>
        </div>
        <button
          onClick={handleDelete}
          className="delete-button bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        businessCard={card}
        username={username} // Pass username here
      />
    </div>
  );
};
