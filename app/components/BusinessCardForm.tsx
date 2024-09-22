import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BusinessCardFormProps {
  onSuccess: (cardData: BusinessCardData) => void;
  initialData?: Partial<BusinessCardData>;
  onDelete?: () => void;
}

export interface BusinessCardData {
  name: string;
  jobTitle: string;
  company: string;
  phoneNumber: string;
  email: string;
  aboutMe: string;
  linkedIn: string;
  twitter: string;
  customMessage: string;
  customSlug?: string;
  prefix: string;
  credentials: string;
  pronouns: string;
  facebookUrl: string;
  instagramUrl: string;
  profilePicture?: File;
  cv?: File;
  cardSlug: string;
  isPrimary: boolean;
  id?: string;
  description: string;
}

export const BusinessCardForm: React.FC<BusinessCardFormProps> = ({ onSuccess, initialData, onDelete }) => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [formData, setFormData] = useState<BusinessCardData>({
    name: initialData?.name || '',
    jobTitle: initialData?.jobTitle || '',
    company: initialData?.company || '',
    phoneNumber: initialData?.phoneNumber || '',
    email: initialData?.email || '',
    aboutMe: initialData?.aboutMe || '',
    linkedIn: initialData?.linkedIn || '',
    twitter: initialData?.twitter || '',
    customMessage: initialData?.customMessage || '',
    customSlug: initialData?.customSlug || '',
    prefix: initialData?.prefix || '',
    credentials: initialData?.credentials || '',
    pronouns: initialData?.pronouns || '',
    facebookUrl: initialData?.facebookUrl || '',
    instagramUrl: initialData?.instagramUrl || '',
    cardSlug: initialData?.cardSlug || '',
    isPrimary: initialData?.isPrimary || false,
    description: initialData?.description || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!db) {
        throw new Error('Firestore is not initialized.');
      }

      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsPro(userDoc.data().isPro || false);
        }
      }
    };

    fetchUserStatus();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prevState) => ({
        ...prevState,
        [name]: files[0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!user) {
      setError('User not authenticated');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSuccess(formData);
    } catch (error) {
      console.error('Error saving business card:', error);
      setError('Failed to save business card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this business card? This action cannot be undone.")) {
      if (onDelete) {
        try {
          await onDelete();
        } catch (error) {
          console.error('Error deleting business card:', error);
          setError('Failed to delete business card. Please try again.');
        }
      }
    }
  };

  if (!user) {
    return <div>Please log in to create or edit a business card.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-1">
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Card Description (e.g., Work, Personal, Side Biz, etc.)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
        <p className="text-xs text-gray-500 italic">
          Note: This is for your reference only and will not be visible on your digital business card.
        </p>
      </div>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Full Name"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="text"
        name="jobTitle"
        value={formData.jobTitle}
        onChange={handleChange}
        placeholder="Job Title"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="text"
        name="company"
        value={formData.company}
        onChange={handleChange}
        placeholder="Company"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="tel"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleChange}
        placeholder="Phone Number"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        required
      />
      <textarea
        name="aboutMe"
        value={formData.aboutMe}
        onChange={handleChange}
        placeholder="About Me"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        rows={3}
      />
      <input
        type="url"
        name="linkedIn"
        value={formData.linkedIn}
        onChange={handleChange}
        placeholder="LinkedIn URL"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="text"
        name="twitter"
        value={formData.twitter}
        onChange={handleChange}
        placeholder="Twitter Handle"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <textarea
        name="customMessage"
        value={formData.customMessage}
        onChange={handleChange}
        placeholder="Custom Message"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        rows={2}
      />
      {isPro && (
        <input
          type="text"
          name="customSlug"
          value={formData.customSlug}
          onChange={handleChange}
          placeholder="Custom Slug (Pro users only)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      )}
      <input
        type="text"
        name="prefix"
        value={formData.prefix}
        onChange={handleChange}
        placeholder="Prefix (e.g., Dr.)"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="text"
        name="credentials"
        value={formData.credentials}
        onChange={handleChange}
        placeholder="Credentials (e.g., PharmD, MD)"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="text"
        name="pronouns"
        value={formData.pronouns}
        onChange={handleChange}
        placeholder="Pronouns"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="url"
        name="facebookUrl"
        value={formData.facebookUrl}
        onChange={handleChange}
        placeholder="Facebook URL"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <input
        type="url"
        name="instagramUrl"
        value={formData.instagramUrl}
        onChange={handleChange}
        placeholder="Instagram URL"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      <div className="space-y-2">
        <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
          Profile Image
        </label>
        <input
          type="file"
          id="profilePicture"
          name="profilePicture"
          onChange={handleFileChange}
          accept="image/*"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div className="flex justify-between items-center mt-6">
        <button
          type="submit"
          className="bg-blue-500 px-2 py-1 rounded-md border border-blue-700 hover:bg-blue-600 transition-colors font-bold text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        
        {initialData && (
          <button
            type="button"
            onClick={handleDelete}
            className="delete-button bg-red-500 px-2 py-1 rounded-md border border-red-700 hover:bg-red-600 transition-colors font-bold text-sm text-white"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
};
