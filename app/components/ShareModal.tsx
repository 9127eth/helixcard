import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BusinessCard } from '@/app/types';
import { Copy, ExternalLink, Download } from 'react-feather'; // Updated import

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessCard: BusinessCard;
  username: string | null; // Add this line
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, businessCard, username }) => {
  const [qrCodeFormat, setQrCodeFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  const [isTransparent, setIsTransparent] = useState(false);
  const [qrCodeSize, setQrCodeSize] = useState(400);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [downloadFeedback, setDownloadFeedback] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.helixcard.app';
  const cardUrl = username ? (
    businessCard.isPrimary 
      ? `${baseUrl}/c/${username}`
      : `${baseUrl}/c/${username}/${businessCard.cardSlug}`
  ) : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(''), 2000); // Clear message after 2 seconds
  };

  const downloadQRCode = () => {
    const svgElement = document.getElementById('qr-code-svg') as unknown as SVGSVGElement;
    const bgColor = isTransparent ? 'transparent' : 'white';
    
    if (qrCodeFormat === 'svg') {
      // For SVG, we can directly modify the SVG string
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const modifiedSvgData = svgData.replace('<svg', `<svg style="background-color: ${bgColor}"`);
      const svgBlob = new Blob([modifiedSvgData], { type: 'image/svg+xml;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `qr-code.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
    } else {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          // Fill the background
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Draw the QR code
          ctx.drawImage(img, 0, 0);
        }
        const downloadUrl = canvas.toDataURL(`image/${qrCodeFormat}`);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = `qr-code.${qrCodeFormat}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      img.src = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(svgElement))}`;
    }
    
    // Set feedback after download is initiated
    setDownloadFeedback('QR code downloaded!');
    setTimeout(() => setDownloadFeedback(''), 2000); // Clear message after 2 seconds
  };

  useEffect(() => {
    const handleResize = () => {
      const modalWidth = document.querySelector('.modal-content')?.clientWidth || 400;
      const isMobile = window.innerWidth < 640; // Define mobile breakpoint
      setQrCodeSize(Math.min(modalWidth - (isMobile ? 40 : 80), isMobile ? 300 : 600)); // Adjust max size for mobile
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
        className={`bg-[#efefef] p-6 sm:p-10 rounded-lg max-w-md w-full relative modal-content transition-all duration-300 ease-in-out transform ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        } max-h-[90vh] overflow-y-auto`}
      >
        <div className="mb-6 text-left">
          <h1 className="text-3xl font-bold mb-2 text-black">
            {businessCard.firstName} {businessCard.lastName}
            {businessCard.credentials && (
              <span className="text-lg ml-2 text-gray-600">
                {businessCard.credentials}
              </span>
            )}
          </h1>
          <p className="text-lg sm:text-xl text-black">
            {businessCard.jobTitle} {businessCard.company && <span className="text-gray-600">| {businessCard.company}</span>}
          </p>
        </div>
        
        <div className="mb-4 sm:mb-6 flex justify-center">
          <QRCodeSVG
            id="qr-code-svg"
            value={cardUrl}
            size={qrCodeSize / 2}
            bgColor={isTransparent ? "transparent" : "white"}
            fgColor="#000000"
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="mb-6 flex flex-col items-center space-y-4">
          <p className="text-xs sm:text-sm mb-2 text-center break-all text-black">{cardUrl}</p>
          <button
            onClick={copyToClipboard}
            className="bg-[#93DBD6] text-black px-4 py-2 rounded flex items-center justify-center w-3/4 sm:w-2/3 hover:bg-[#7bcbc5]"
          >
            <Copy className="mr-2 text-[#FF6A42]" size={16} /> Copy URL
          </button>
          {copyFeedback && <p className="text-green-600 text-xs sm:text-sm">{copyFeedback}</p>}
          <button
            onClick={() => window.open(cardUrl, '_blank')}
            className="bg-[#000000] text-white px-4 py-2 rounded flex items-center justify-center w-3/4 sm:w-2/3 hover:bg-[#333333]"
          >
            <ExternalLink className="mr-2" size={16} /> View in Browser
          </button>
        </div>
        <div className="border-t border-gray-300 pt-6 mt-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 text-center text-black">Download QR Code</h3>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
            <select
              value={qrCodeFormat}
              onChange={(e) => setQrCodeFormat(e.target.value as 'png' | 'jpeg' | 'svg')}
              className="p-1 border rounded text-sm w-full sm:w-1/4 text-black bg-white"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="svg">SVG</option>
            </select>
            <label className="flex items-center text-sm text-black">
              <input
                type="checkbox"
                checked={isTransparent}
                onChange={(e) => setIsTransparent(e.target.checked)}
                className="mr-1"
              />
              No background
            </label>
          </div>
          <div
            onClick={downloadQRCode}
            className="text-black cursor-pointer flex items-center justify-center"
          >
            <Download className="mr-2 text-[#FF6A42]" size={16} /> Download
          </div>
          {downloadFeedback && <p className="text-green-600 text-xs sm:text-sm text-center mt-2">{downloadFeedback}</p>}
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-500 hover:text-gray-700 text-2xl p-2"
        >
          ×
        </button>
      </div>
    </div>
  );
};