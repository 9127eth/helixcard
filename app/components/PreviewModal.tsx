import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { DevicePhoneMobileIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { BusinessCard } from '@/app/types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BusinessCard;
  username?: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, card, username }) => {
  const [showQR, setShowQR] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Create a URL for the card (in a real app, this would be a shareable link)
  const cardUrl = !card ? '' : (card.isPrimary 
    ? `${window.location.origin}/c/${username || card.username || ''}`
    : `${window.location.origin}/c/${username || card.username || ''}/${card.cardSlug || ''}`);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Reset loading state when QR changes
  useEffect(() => {
    setIsLoading(true);
  }, [showQR]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const getDeviceFrame = () => {
    if (isMobile) {
      return 'w-[270px] h-[550px] rounded-[36px] border-[10px] border-gray-800';
    } else {
      return 'w-[300px] h-[600px] rounded-[36px] border-[12px] border-gray-800';
    }
  };

  const getDeviceInnerFrame = () => {
    return 'w-full h-full rounded-[24px] overflow-hidden';
  };

  const getDeviceContainer = () => {
    if (isMobile) {
      return 'h-[530px] overflow-hidden';
    } else {
      return 'h-[576px] overflow-hidden';
    }
  };

  const getIframeWidth = () => {
    return '375px';
  };

  const getIframeHeight = () => {
    return '812px'; // iPhone X/11 Pro height
  };

  const getIframeScale = () => {
    if (isMobile) {
      return 'scale-[0.63]';
    } else {
      return 'scale-[0.7]';
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
  };

  const openInBrowser = () => {
    window.open(cardUrl, '_blank');
  };

  // If card is null or undefined, don't render the modal
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-gray-800 text-xl font-semibold">Preview Card</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
          <div className="flex flex-col w-full md:w-auto">
            {/* Device controls */}
            <div className="bg-gray-50 p-4 flex space-x-2 md:flex-col md:space-x-0 md:space-y-2 md:p-4 md:border-r md:border-gray-200">
              <button 
                onClick={() => setShowQR(false)}
                className={`flex items-center justify-center p-2 rounded-lg transition-colors ${!showQR ? 'bg-[#7CCEDA] text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                title="Phone Preview"
              >
                <DevicePhoneMobileIcon className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setShowQR(!showQR)}
                className={`flex items-center justify-center p-2 rounded-lg transition-colors ${showQR ? 'bg-[#7CCEDA] text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                title="QR Code"
              >
                <QrCodeIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Main preview area */}
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Device preview */}
            <div className="flex-grow flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden bg-gray-100">
              {showQR ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`w-[300px] h-[600px] flex items-center justify-center`}
                >
                  <div className="bg-white p-8 rounded-xl shadow-lg">
                    <QRCodeSVG value={cardUrl} size={isMobile ? 200 : 250} />
                    <p className="text-center mt-4 text-gray-800 font-medium">Scan to view card</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`${getDeviceFrame()} bg-gray-900 shadow-2xl relative mx-auto overflow-hidden`}
                >
                  {/* iPhone details */}
                  <>
                    {/* Side buttons */}
                    <div className="absolute top-[50%] right-[-10px] w-[3px] h-[60px] bg-gray-700 rounded-l-full transform -translate-y-1/2"></div>
                    <div className="absolute top-[20%] left-[-10px] w-[3px] h-[35px] bg-gray-700 rounded-r-full transform -translate-y-1/2"></div>
                    <div className="absolute top-[30%] left-[-10px] w-[3px] h-[35px] bg-gray-700 rounded-r-full transform -translate-y-1/2"></div>
                    
                    {/* iPhone notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[25px] bg-gray-900 rounded-b-[14px] z-10"></div>
                    <div className="absolute top-[10px] left-1/2 transform -translate-x-1/2 flex items-center justify-center z-20">
                      <div className="w-[8px] h-[8px] rounded-full bg-gray-700 mx-1"></div>
                      <div className="w-[6px] h-[6px] rounded-full bg-gray-600 mx-3"></div>
                    </div>
                  </>
                  
                  {/* Device screen */}
                  <div className={`${getDeviceInnerFrame()} bg-white`}>
                    {/* Iframe container */}
                    <div className={`${getDeviceContainer()} relative`}>
                      {/* Loading indicator */}
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#7CCEDA] rounded-full animate-spin"></div>
                        </div>
                      )}
                      
                      {/* Iframe with actual card URL */}
                      <div className="absolute top-0 left-0 w-full h-full flex items-start justify-center overflow-hidden">
                        <div className={`transform origin-top ${getIframeScale()}`}>
                          <iframe 
                            src={cardUrl}
                            width={getIframeWidth()}
                            height={getIframeHeight()}
                            className="border-0"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            onLoad={() => setIsLoading(false)}
                            title="Card Preview"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Footer with URL and buttons */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <div className="text-center">
                  <span className="text-gray-600 text-sm truncate">{cardUrl}</span>
                </div>
                <div className="flex justify-center space-x-4">
                  <button 
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-[#7CCEDA] text-gray-900 font-medium rounded-lg hover:bg-[#6BA5FF] transition-colors flex items-center shadow-sm"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-5 h-5 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
                        Copy Link
                      </>
                    )}
                  </button>
                  <button 
                    onClick={openInBrowser}
                    className="px-4 py-2 bg-[#6BA5FF] text-gray-900 font-medium rounded-lg hover:bg-[#5A94EE] transition-colors flex items-center shadow-sm"
                  >
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2" />
                    View in Browser
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PreviewModal;
