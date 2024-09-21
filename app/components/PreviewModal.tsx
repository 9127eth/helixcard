import React from 'react';
import { BusinessCard } from '@/app/types';
import BusinessCardDisplay from './BusinessCardDisplay';
import { useState } from 'react';
import { FaCopy, FaExternalLinkAlt } from 'react-icons/fa';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BusinessCard | null;
  username: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, card, username }) => {
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const cardUrl = card.isPrimary ? `/c/${username}` : `/c/${username}/${card.cardSlug}`;
  const fullCardUrl = `https://www.helixcard.app${cardUrl}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullCardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div 
      className={`w-1/3 transition-all duration-300 ease-in-out ${
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="p-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-700">
          Close Preview
        </button>
        <BusinessCardDisplay card={card} />
        <div className="mt-8 flex justify-center">
          <a 
            href={cardUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-xs flex items-center"
          >
            View in Browser
            <FaExternalLinkAlt className="ml-1" size={10} />
          </a>
        </div>
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center">
            <span className="text-xs font-semibold">Card URL</span>
            <button onClick={handleCopyUrl} className="ml-2 relative">
              <FaCopy className="text-gray-500 hover:text-gray-700" />
              {copied && (
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs py-1 px-2 rounded">
                  Copied!
                </span>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">{fullCardUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
