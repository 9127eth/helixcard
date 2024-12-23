import { useState, useEffect } from 'react';
import { Upload } from 'react-feather';
import { Contact } from '../types';
import { useAuth } from '@/app/hooks/useAuth';
import Image from 'next/image';

interface ContactOCRUploadProps {
  onScanComplete: (contactData: Partial<Contact> & { imageFile?: File }) => void;
  onError: (error: string) => void;
}

export function ContactOCRUpload({ onScanComplete, onError }: ContactOCRUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user } = useAuth();

  const handleImageUpload = async (file: File) => {
    if (!user) {
      onError('You must be logged in to upload images');
      return;
    }

    try {
      setIsProcessing(true);
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
        const error = await response.json();
        throw new Error(error.message || 'Failed to process image');
      }

      const contactData = await response.json();
      // Pass the file along with the contact data
      onScanComplete({ ...contactData, imageFile: file });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to process image');
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
          Upload Image
          <input
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
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
          Processing image...
        </div>
      )}
    </div>
  );
} 