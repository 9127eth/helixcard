import React, { useState, useEffect } from 'react';
import { BusinessCard } from '@/app/types';
import { Copy, ExternalLink } from 'react-feather'; // Add this import

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
      className={`fixed top-0 right-0 w-full md:w-1/3 h-full z-50 transition-all duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="bg-[#2c2d31] h-full shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-300 hover:text-gray-100 px-2 py-1"
          >
            Close Preview
          </button>
          <h2 className="text-xl font-semibold mb-4 text-white">Card Preview</h2>
        </div>
        <div className="flex-grow overflow-hidden">
          <iframe
            key={iframeKey}
            src={cardUrl}
            className="w-full h-full border-none"
            title="Business Card Preview"
          />
        </div>
        <div className="p-4 bg-[#2c2d31]">
          <div className="flex justify-center mb-4">
            <a 
              href={cardUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm flex items-center"
            >
              View in Browser
              <ExternalLink className="ml-1" size={14} /> {/* Updated icon */}
            </a>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-sm font-semibold text-white">Card URL</span>
              <button onClick={handleCopyUrl} className="ml-2 relative">
                <Copy className="text-gray-300 hover:text-gray-100" size={16} /> {/* Updated icon */}
                {copied && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs py-1 px-2 rounded">
                    Copied!
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-300 break-all">{cardUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
