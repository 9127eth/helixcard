import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faTwitter, faFacebook, faInstagram, faTiktok, faYoutube, faDiscord, faTwitch, faSnapchat, faTelegram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

interface BusinessCardFormProps {
  onSuccess: (cardData: import('../types').BusinessCardData) => void;
  initialData?: Partial<import('../types').BusinessCardData>;
  onDelete?: () => void;
}

export interface BusinessCardData {
  firstName: string;
  middleName?: string;
  lastName: string;
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
  tiktokUrl?: string;
  youtubeUrl?: string;
  discordUrl?: string;
  twitchUrl?: string;
  snapchatUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
}

export const BusinessCardForm: React.FC<BusinessCardFormProps> = ({ onSuccess, initialData, onDelete }) => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [formData, setFormData] = useState<BusinessCardData>({
    firstName: initialData?.firstName || '',
    middleName: initialData?.middleName || '',
    lastName: initialData?.lastName || '',
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
    tiktokUrl: initialData?.tiktokUrl || '',
    youtubeUrl: initialData?.youtubeUrl || '',
    discordUrl: initialData?.discordUrl || '',
    twitchUrl: initialData?.twitchUrl || '',
    snapchatUrl: initialData?.snapchatUrl || '',
    telegramUrl: initialData?.telegramUrl || '',
    whatsappUrl: initialData?.whatsappUrl || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    return <div className="text-sm">Please log in to create or edit a business card.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm">
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="space-y-4">
        <h3 className="font-semibold">Card Description</h3>
        <div className="space-y-1">
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Card Description (e.g., Work, Personal, Side Biz, etc.)"
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            required
          />
          <p className="text-xs text-gray-500 italic">
            Note: This is for your reference only and will not be visible on your digital business card.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Basic Information</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-xs mb-1 font-bold text-gray-400">First Name</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="middleName" className="block text-xs mb-1 font-bold text-gray-400">Middle Name</label>
            <input
              id="middleName"
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Middle Name"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-xs mb-1 font-bold text-gray-400">Last Name</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="jobTitle" className="block text-xs mb-1 font-bold text-gray-400">Job Title</label>
            <input
              id="jobTitle"
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="Job Title"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-xs mb-1 font-bold text-gray-400">Company</label>
            <input
              id="company"
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Company"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label htmlFor="pronouns" className="block text-xs mb-1 font-bold text-gray-400">Pronouns</label>
            <input
              id="pronouns"
              type="text"
              name="pronouns"
              value={formData.pronouns}
              onChange={handleChange}
              placeholder="Pronouns"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label htmlFor="prefix" className="block text-xs mb-1 font-bold text-gray-400">Prefix</label>
            <input
              id="prefix"
              type="text"
              name="prefix"
              value={formData.prefix}
              onChange={handleChange}
              placeholder="Prefix"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label htmlFor="credentials" className="block text-xs mb-1 font-bold text-gray-400">Credentials</label>
            <input
              id="credentials"
              type="text"
              name="credentials"
              value={formData.credentials}
              onChange={handleChange}
              placeholder="Credentials"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="aboutMe" className="block text-xs mb-1 font-bold text-gray-400">About Me</label>
          <textarea
            id="aboutMe"
            name="aboutMe"
            value={formData.aboutMe}
            onChange={handleChange}
            placeholder="About Me"
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phoneNumber" className="block text-xs mb-1 font-bold text-gray-400">Phone Number</label>
            <input
              id="phoneNumber"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs mb-1 font-bold text-gray-400">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Social Links</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faLinkedin} className="w-6 h-6" />
            <input
              type="url"
              name="linkedIn"
              value={formData.linkedIn}
              onChange={handleChange}
              placeholder="LinkedIn URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faTwitter} className="w-6 h-6" />
            <input
              type="text"
              name="twitter"
              value={formData.twitter}
              onChange={handleChange}
              placeholder="Twitter Handle"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faFacebook} className="w-6 h-6" />
            <input
              type="url"
              name="facebookUrl"
              value={formData.facebookUrl}
              onChange={handleChange}
              placeholder="Facebook URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faInstagram} className="w-6 h-6" />
            <input
              type="url"
              name="instagramUrl"
              value={formData.instagramUrl}
              onChange={handleChange}
              placeholder="Instagram URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faTiktok} className="w-6 h-6" />
            <input
              type="url"
              name="tiktokUrl"
              value={formData.tiktokUrl}
              onChange={handleChange}
              placeholder="TikTok URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faYoutube} className="w-6 h-6" />
            <input
              type="url"
              name="youtubeUrl"
              value={formData.youtubeUrl}
              onChange={handleChange}
              placeholder="YouTube URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faDiscord} className="w-6 h-6" />
            <input
              type="url"
              name="discordUrl"
              value={formData.discordUrl}
              onChange={handleChange}
              placeholder="Discord URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faTwitch} className="w-6 h-6" />
            <input
              type="url"
              name="twitchUrl"
              value={formData.twitchUrl}
              onChange={handleChange}
              placeholder="Twitch URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faSnapchat} className="w-6 h-6" />
            <input
              type="url"
              name="snapchatUrl"
              value={formData.snapchatUrl}
              onChange={handleChange}
              placeholder="Snapchat URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faTelegram} className="w-6 h-6" />
            <input
              type="url"
              name="telegramUrl"
              value={formData.telegramUrl}
              onChange={handleChange}
              placeholder="Telegram URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faWhatsapp} className="w-6 h-6" />
            <input
              type="url"
              name="whatsappUrl"
              value={formData.whatsappUrl}
              onChange={handleChange}
              placeholder="WhatsApp URL"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Additional Information</h3>
        <div>
          <label htmlFor="customMessage" className="block text-xs mb-1 font-bold text-gray-400">Custom Message</label>
          <textarea
            id="customMessage"
            name="customMessage"
            value={formData.customMessage}
            onChange={handleChange}
            placeholder="Custom Message"
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="profilePicture" className="block text-xs mb-1 font-bold text-gray-400">
            Profile Image
          </label>
          <input
            type="file"
            id="profilePicture"
            name="profilePicture"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
          />
        </div>
        {isPro && (
          <div className="space-y-2">
            <label htmlFor="cv" className="block text-xs font-medium text-gray-400">
              CV Upload (Pro feature)
            </label>
            <input
              type="file"
              id="cv"
              name="cv"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          type="submit"
          className="bg-blue-500 px-3 py-1 rounded-md border border-blue-700 hover:bg-blue-600 transition-colors font-medium text-xs text-white"
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
