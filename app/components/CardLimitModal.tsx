import React from 'react';
import { useRouter } from 'next/navigation';

interface CardLimitModalProps {
  isPro: boolean;
  limit: number;
  onClose: () => void;
}

const CardLimitModal: React.FC<CardLimitModalProps> = ({ isPro, limit, onClose }) => {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Card Limit Reached</h2>
        <p className="mb-4">
          {isPro
            ? `You have reached the maximum limit of ${limit} business cards. Please contact support to increase your limit.`
            : `Free users can only create ${limit} business card. Upgrade to HelixPro to create more cards.`}
        </p>
        <div className="flex justify-between">
          {!isPro && (
            <button 
              onClick={() => router.push('/get-helix-pro')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
            >
              Upgrade to Pro
            </button>
          )}
          <button 
            onClick={() => router.push('/support')}
            className="bg-primary text-black px-4 py-2 rounded hover:bg-green-600 mr-2"
          >
            Contact Support
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardLimitModal;
