import React, { useState, useEffect } from 'react';
import { BusinessCard } from '@/app/types';
import { FaCopy, FaExternalLinkAlt } from 'react-icons/fa';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BusinessCard | null;
  username: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, card, username }) => {
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIframeKey(prev => prev + 1); // Force iframe reload when modal opens
    }
  }, [isOpen]);

  if (!card) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.helixcard.app';
  const cardUrl = card.isPrimary 
    ? `${baseUrl}/c/${username}`
    : `${baseUrl}/c/${username}/${card.cardSlug}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`fixed top-0 right-0 w-1/3 h-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 relative">
          <button onClick={onClose} className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-700">
            Close Preview
          </button>
        </div>
        <div className="flex-grow overflow-hidden">
          <iframe
            key={iframeKey}
            src={cardUrl}
            className="w-full h-full border-none"
            title="Business Card Preview"
          />
        </div>
        <div className="p-4">
          <div className="flex justify-center">
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
            <p className="text-xs text-gray-600 mt-1 break-all">{cardUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
