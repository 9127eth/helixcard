import { useState, useEffect, useRef } from 'react';
import { Upload, AlertCircle, Camera } from 'react-feather';
import { Contact } from '../types';
import { useAuth } from '@/app/hooks/useAuth';
import Image from 'next/image';
import { btnSecondary, sectionIconClass } from './ui/editor';

interface ContactOCRUploadProps {
  onScanStart?: () => void;
  onScanComplete: (contactData: Partial<Contact> & { imageFile?: File }) => void;
  onError: (error: string) => void;
}

interface ErrorResponse {
  error: string;
  details?: string;
  suggestions?: string[];
}

// Vercel refuses request bodies over 4.5 MB, and reading a card needs nowhere
// near a full-resolution phone photo.
const MAX_SCAN_DIMENSION = 1600;
const SCAN_JPEG_QUALITY = 0.85;
const SMALL_IMAGE_BYTES = 1024 * 1024;

/**
 * Shrink a photo to MAX_SCAN_DIMENSION on its longest side, as a JPEG. The
 * original is used when it is already small or the browser cannot decode it
 * (HEIC outside Safari, for example).
 */
async function prepareScanImage(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = document.createElement('img');
    image.src = objectUrl;
    await image.decode();

    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    if (longestSide <= MAX_SCAN_DIMENSION && file.size <= SMALL_IMAGE_BYTES) return file;

    const scale = Math.min(1, MAX_SCAN_DIMENSION / longestSide);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;

    // JPEG has no transparency; unfilled areas would come out black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', SCAN_JPEG_QUALITY);
    });
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]*$/, '') || 'business-card';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Our routes answer with JSON, but a platform error (Vercel's 413) may not. */
async function readErrorResponse(response: Response): Promise<ErrorResponse> {
  try {
    const body = await response.json();
    if (body && typeof body.error === 'string') return body as ErrorResponse;
  } catch {
    // Not JSON; fall through to a readable message.
  }
  return {
    error: response.status === 413
      ? 'This image is too large to scan. Please try a smaller photo.'
      : 'Failed to process image',
  };
}

export function ContactOCRUpload({ onScanStart, onScanComplete, onError }: ContactOCRUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanError, setScanError] = useState<ErrorResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const { user } = useAuth();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

    onScanStart?.();

    try {
      setIsProcessing(true);
      setScanError(null);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Get the current ID token
      const idToken = await user.getIdToken();

      // The smaller image is also the one saved with the contact.
      const image = await prepareScanImage(file);
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/contact-ocr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      const result = response.ok ? await response.json() : await readErrorResponse(response);
      // A scan that finishes after the form was closed must not fill in the next contact.
      if (!isMountedRef.current) return;

      if (!response.ok) {
        setScanError(result);
        onError(result.error);
        return;
      }

      onScanComplete({ ...result, imageFile: image });
    } catch (error) {
      if (!isMountedRef.current) return;
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
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-center dark:border-white/15 dark:bg-white/[0.03]">
      {imagePreview ? (
        <div className="relative h-48 w-full overflow-hidden rounded-xl bg-white ring-1 ring-black/5 dark:bg-black/20 dark:ring-white/10">
          <Image
            src={imagePreview}
            alt="Business card preview"
            fill
            className="object-contain"
            sizes="(max-width: 500px) 100vw, 500px"
          />
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] dark:bg-black/50">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#7CCEDA]" aria-hidden />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className={sectionIconClass}>
            <Camera size={16} />
          </span>
          <p className="text-sm font-medium">Scan a business card</p>
          <p className="max-w-xs text-xs text-gray-500 dark:text-gray-400">
            Take a photo or pick an image and we&apos;ll fill in the details for you.
          </p>
        </div>
      )}

      <label className={`${btnSecondary} cursor-pointer ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}>
        <Upload size={15} />
        {isProcessing ? 'Processing…' : imagePreview ? 'Choose another image' : 'Upload image'}
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
          disabled={isProcessing}
        />
      </label>

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-[#7CCEDA]" aria-hidden />
          Reading the card…
        </div>
      )}

      {scanError && (
        <div role="alert" className="flex w-full items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-left text-sm dark:border-red-500/30 dark:bg-red-500/10">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0">
            <p className="font-medium text-red-700 dark:text-red-300">{scanError.error}</p>
            {scanError.details && (
              <p className="mt-1 text-gray-700 dark:text-gray-300">{scanError.details}</p>
            )}
            {scanError.suggestions && (
              <ul className="mt-2 list-inside list-disc text-xs text-gray-600 dark:text-gray-400">
                {scanError.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
