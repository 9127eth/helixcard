import { useState, useEffect, useRef } from 'react';
import { Upload } from 'react-feather';
import { Contact } from '../types';
import { useAuth } from '@/app/hooks/useAuth';
import Image from 'next/image';

interface ContactOCRUploadProps {
  onScanComplete: (contactData: Partial<Contact> & { imageFile?: File }) => void;
  onError: (error: string) => void;
}

interface ErrorResponse {
  error: string;
  details?: string;
  suggestions?: string[];
}

export function ContactOCRUpload({ onScanComplete, onError }: ContactOCRUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanError, setScanError] = useState<ErrorResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Add useEffect to trigger file input on mount
  useEffect(() => {
    // Small delay to ensure the input is mounted
    const timer = setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!user) {
      onError('You must be logged in to upload images');
      return;
    }

    try {
      setIsProcessing(true);
      setScanError(null);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Get the current ID token
      const idToken = await user.getIdToken();

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/contact-ocr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        setScanError(errorData);
        onError(errorData.error);
        return;
      }

      const contactData = await response.json();
      onScanComplete({ ...contactData, imageFile: file });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      setScanError({ error: errorMessage });
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg">
      {imagePreview && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <Image
            src={imagePreview}
            alt="Business card preview"
            fill
            className="object-contain"
            sizes="(max-width: 500px) 100vw, 500px"
          />
        </div>
      )}

      <div className="flex gap-4">
        <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none cursor-pointer">
          <Upload className="w-5 h-5" />
          {isProcessing ? 'Processing...' : 'Upload Image'}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            disabled={isProcessing}
          />
        </label>
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-[#7CCEDA] rounded-full animate-spin"></div>
          Processing image...
        </div>
      )}

      {scanError && (
        <div className="w-full mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 font-medium">{scanError.error}</p>
          {scanError.details && (
            <p className="mt-2 text-gray-700">{scanError.details}</p>
          )}
          {scanError.suggestions && (
            <ul className="mt-2 list-disc list-inside text-gray-600 text-sm">
              {scanError.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 