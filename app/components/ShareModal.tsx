import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QRCodeSVG } from 'qrcode.react'; // Keep this import
import { BusinessCard } from '@/app/types';
import { FaCopy, FaExternalLinkAlt } from 'react-icons/fa';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessCard: BusinessCard;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, businessCard }) => {
  const [qrCodeFormat, setQrCodeFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  const [isTransparent, setIsTransparent] = useState(false);
  const [qrCodeSize, setQrCodeSize] = useState(400); // Increased size for better quality

  // Generate the correct URL based on whether the card is primary or not
  const cardUrl = `${process.env.NEXT_PUBLIC_API_URL}/c/${
    businessCard.username
  }${businessCard.isPrimary ? '' : `/${businessCard.cardSlug}`}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cardUrl);
    // You might want to add a toast notification here
  };

  const downloadQRCode = () => {
    if (qrCodeFormat === 'svg') {
      const svgElement = document.getElementById('qr-code-svg') as unknown as SVGSVGElement;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `qr-code.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
    } else {
      const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
      const downloadUrl = canvas.toDataURL(`image/${qrCodeFormat}`);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `qr-code.${qrCodeFormat}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const modalWidth = document.querySelector('.modal-content')?.clientWidth || 400;
      setQrCodeSize(Math.min(modalWidth - 40, 600)); // Max size of 600px, with 20px padding on each side
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div
      className={`fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div 
        className={`bg-white p-6 rounded-lg max-w-md w-full relative modal-content transition-all duration-300 ease-in-out transform ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Digital Business Card</h2>
        <div className="mb-4 flex justify-center">
          {qrCodeFormat === 'svg' ? (
            <QRCodeSVG
              id="qr-code-svg"
              value={cardUrl}
              size={qrCodeSize}
              bgColor={isTransparent ? "transparent" : "#ffffff"}
              fgColor="#000000"
              level="H"
              includeMargin={true}
            />
          ) : (
            <QRCodeCanvas
              id="qr-code"
              value={cardUrl}
              size={qrCodeSize}
              bgColor={isTransparent ? "transparent" : "#ffffff"}
              fgColor="#000000"
              level="H"
              includeMargin={true}
            />
          )}
        </div>
        <div className="mb-4">
          <p className="text-sm mb-2 text-center">{cardUrl}</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
            >
              <FaCopy className="mr-2" /> Copy URL
            </button>
            <button
              onClick={() => window.open(cardUrl, '_blank')}
              className="bg-green-500 text-white px-4 py-2 rounded flex items-center"
            >
              <FaExternalLinkAlt className="mr-2" /> Preview
            </button>
          </div>
        </div>
        <div className="mb-4 flex justify-center items-center space-x-2">
          <select
            value={qrCodeFormat}
            onChange={(e) => setQrCodeFormat(e.target.value as 'png' | 'jpeg' | 'svg')}
            className="p-2 border rounded"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="svg">SVG</option>
          </select>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isTransparent}
              onChange={(e) => setIsTransparent(e.target.checked)}
              className="mr-1"
            />
            Transparent
          </label>
          <button
            onClick={downloadQRCode}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Download QR Code
          </button>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
    </div>
  );
};
