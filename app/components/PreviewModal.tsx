import React from 'react';
import { BusinessCard } from '@/app/types';
import BusinessCardDisplay from './BusinessCardDisplay';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BusinessCard | null;
  username: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, card, username }) => {
  if (!card) return null;

  const cardUrl = card.isPrimary ? `/c/${username}` : `/c/${username}/${card.cardSlug}`;

  return (
    <div 
      className={`w-1/3 transition-all duration-300 ease-in-out ${
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="p-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl">&times;</button>
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <BusinessCardDisplay card={card} />
        <div className="flex justify-center mt-4">
          <a href={cardUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
            Preview
          </a>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
