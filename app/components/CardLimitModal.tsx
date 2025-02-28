import React from 'react';
import { useRouter } from 'next/navigation';

interface CardLimitModalProps {
  isPro: boolean;
  limit: number;
  onClose: () => void;
  type?: 'contact' | 'card';
}

const CardLimitModal: React.FC<CardLimitModalProps> = ({ isPro, limit, onClose, type = 'card' }) => {
  const router = useRouter();

  const getMessage = () => {
    if (isPro) {
      return `You have reached the maximum limit of ${limit} ${type}s. Please contact support to increase your limit.`;
    }
    
    if (type === 'contact') {
      return `You've reached the free limit of ${limit} contacts.`;
    }
    
    return `You've reached the free limit of ${limit} business cards.`;
  };

  const getFeatures = () => [
    'Create up to 10 business cards',
    'AI-powered business card scanning',
    'CV/Resume upload capability',
    'Plus future premium features as they launch'
  ];

  if (isPro) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Limit Reached</h2>
          <p className="mb-6 text-gray-700 dark:text-gray-300">
            {getMessage()}
          </p>
          <div className="flex justify-between">
            <button 
              onClick={onClose}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={() => router.push('/support')}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-0 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Upgrade to Helix Pro</h2>
          <p className="opacity-90">Unlock premium features and remove limits</p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">{getMessage()}</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Helix Pro Benefits:</h3>
              <ul className="space-y-2">
                {getFeatures().map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => router.push('/get-helix-pro')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              View Pricing
            </button>
            <button 
              onClick={onClose}
              className="w-full text-gray-600 dark:text-gray-400 px-6 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardLimitModal;
