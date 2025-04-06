import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deleteCv } from '../lib/firebaseOperations';
import { uploadImage, deleteImage } from '../lib/uploadUtils';
import Image from 'next/image';
import CollapsibleSection from './CollapsibleSection';
import { 
  Linkedin, Facebook, Instagram, Youtube, 
  Link as LinkIcon, Plus, AtSign, Eye, Copy, Trash2, Phone,
} from 'react-feather';
import { FaTiktok, FaTwitch, FaSnapchatGhost, FaTelegram, FaDiscord } from 'react-icons/fa';
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // Import the library
import ReactPhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import LoadingSpinner from './LoadingSpinner';
import Link from 'next/link';
import { X as XIcon } from 'react-feather';
import { MyXIcon } from './MyIcons';
import { CardTheme } from '../types';

// Create Bluesky icon component
const BlueSkyIcon: React.FC<{ size?: number, className?: string }> = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    className={className}
    fill="currentColor"
  >
    <path d="M0 0 C6.60371256 2.2859005 11.06092469 6.64697844 15.25 12.125 C15.91 12.125 16.57 12.125 17.25 12.125 C18.360682 10.91760954 19.41465549 9.65765169 20.4375 8.375 C23.78561374 4.46423644 26.48346092 2.11827998 31.25 0.125 C34.5625 0.1875 34.5625 0.1875 37.25 1.125 C39.7090567 4.81358506 39.58184578 7.66982186 39.5625 11.9375 C39.57861328 12.63681641 39.59472656 13.33613281 39.61132812 14.05664062 C39.61577759 18.81311385 38.85843675 22.13598548 36.25 26.125 C35.26 26.455 34.27 26.785 33.25 27.125 C33.25 27.785 33.25 28.445 33.25 29.125 C33.91 29.125 34.57 29.125 35.25 29.125 C36.72896861 32.08293723 36.6855582 33.82720224 36.25 37.125 C33.81324001 41.31100555 31.0713101 43.71434495 26.75 45.875 C23.02387847 46.14115154 22.56173673 46.04851422 19.8125 43.875 C17.25 41.125 17.25 41.125 17.25 39.125 C16.59 39.125 15.93 39.125 15.25 39.125 C15.0025 39.723125 14.755 40.32125 14.5 40.9375 C12.98384379 43.59077338 12.01512942 44.77980191 9.25 46.125 C4.63720445 45.61246716 1.93148556 44.19306974 -1.1875 40.875 C-3.24853601 38.24937167 -3.73576867 37.23275152 -4.1875 33.8125 C-3.75 31.125 -3.75 31.125 -2.75 29.125 C-2.09 29.125 -1.43 29.125 -0.75 29.125 C-0.75 28.465 -0.75 27.805 -0.75 27.125 C-1.36875 26.898125 -1.9875 26.67125 -2.625 26.4375 C-5.49714896 24.66352564 -5.76749597 23.34830268 -6.75 20.125 C-6.98897677 17.38788234 -7.11998807 14.79650535 -7.125 12.0625 C-7.16173828 11.00192383 -7.16173828 11.00192383 -7.19921875 9.91992188 C-7.21896125 6.41562757 -7.01483031 4.48090065 -4.8984375 1.63671875 C-2.75 0.125 -2.75 0.125 0 0 Z M-1.75 5.125 C-1.8309313 7.72978883 -1.89045434 10.33206653 -1.9375 12.9375 C-1.96263672 13.67548828 -1.98777344 14.41347656 -2.01367188 15.17382812 C-2.09592693 19.35602645 -2.09592693 19.35602645 -0.5 23.125 C1.65063722 24.35393556 2.97536054 24.43358883 5.4375 24.3125 C6.695625 24.250625 7.95375 24.18875 9.25 24.125 C8.88594751 26.82938996 8.56857318 27.86906383 6.40234375 29.609375 C5.30599609 30.23585938 5.30599609 30.23585938 4.1875 30.875 C3.45402344 31.30296875 2.72054688 31.7309375 1.96484375 32.171875 C1.39894531 32.48640625 0.83304688 32.8009375 0.25 33.125 C2.68573873 37.60159284 2.68573873 37.60159284 6.25 41.125 C8.25113033 41.07520177 8.25113033 41.07520177 10.25 40.125 C11.81473341 38.05797415 11.81473341 38.05797415 13 35.5625 C13.64195313 34.32306641 13.64195313 34.32306641 14.296875 33.05859375 C14.61140625 32.42050781 14.9259375 31.78242187 15.25 31.125 C15.91 31.125 16.57 31.125 17.25 31.125 C18.7578125 33.3125 18.7578125 33.3125 20.375 36.125 C20.91382812 37.053125 21.45265625 37.98125 22.0078125 38.9375 C22.41773437 39.659375 22.82765625 40.38125 23.25 41.125 C26.56697361 40.56508352 27.96174669 39.72355293 30 37.0625 C31.11375 35.6084375 31.11375 35.6084375 32.25 34.125 C30.10233207 31.81824556 28.25604076 30.12843225 25.5 28.5625 C24.7575 28.088125 24.015 27.61375 23.25 27.125 C23.25 26.135 23.25 25.145 23.25 24.125 C25.23567708 24.22265625 27.22135417 24.3203125 29.20703125 24.41796875 C31.28386912 24.24797557 31.28386912 24.24797557 33 23.125 C34.99250219 19.93699649 34.56123006 16.57008765 34.4375 12.9375 C34.42396484 12.18791016 34.41042969 11.43832031 34.39648438 10.66601562 C34.36118539 8.81870233 34.30737917 6.97175934 34.25 5.125 C27.28841539 6.33922987 24.4215257 9.70758317 20.4375 15.375 C19.36772697 16.95342844 18.30279107 18.53519446 17.25 20.125 C13.63633823 18.92044608 13.37830114 18.06178058 11.5 14.875 C8.59732734 10.33640709 5.89527369 7.84204688 1.25 5.125 C0.26 5.125 -0.73 5.125 -1.75 5.125 Z " transform="translate(7.75,0.875)"/>
  </svg>
);

interface BusinessCardFormProps {
  onSuccess: (cardData: BusinessCardData) => Promise<void>;
  initialData?: Partial<BusinessCardData>;
  onDelete?: () => void;
  isEditing?: boolean;
  onChange?: (formData: BusinessCardData) => void;
}

export interface BusinessCardData {
  firstName: string;
  middleName?: string;
  lastName?: string;
  jobTitle: string;
  company: string;
  phoneNumber: string;
  email?: string;
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
  webLinks: { url: string; displayText: string }[];
  customMessageHeader: string;
  threadsUrl?: string;
  cvUrl?: string;
  cvHeader?: string;
  cvDescription?: string;
  cvDisplayText?: string;
  imageUrl?: string;
  isActive: boolean;
  theme: CardTheme;
  enableTextMessage: boolean;
  blueskyUrl: string;
}

export const BusinessCardForm: React.FC<BusinessCardFormProps> = ({
  onSuccess,
  initialData,
  onDelete,
  isEditing = false,
  onChange,
}) => {
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
    blueskyUrl: initialData?.blueskyUrl || '',
    webLinks: initialData?.webLinks || [{ url: '', displayText: '' }],
    customMessageHeader: initialData?.customMessageHeader || '',
    threadsUrl: initialData?.threadsUrl || '',
    cvUrl: initialData?.cvUrl || '',
    cvHeader: initialData?.cvHeader || '',
    cvDescription: initialData?.cvDescription || '',
    cvDisplayText: initialData?.cvDisplayText || '',
    imageUrl: initialData?.imageUrl || '',
    isActive: initialData?.isActive ?? true, // Default to true if not provided
    theme: initialData?.theme || 'classic',
    enableTextMessage: initialData ? (initialData.enableTextMessage ?? true) : false,
  });

  const [additionalSocialLinks, setAdditionalSocialLinks] = useState<string[]>(['linkedIn']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSocialLinkDropdown, setShowSocialLinkDropdown] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    console.log('Initial data:', initialData);
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));

      const socialLinks = [
        'linkedIn', 'twitter', 'facebookUrl', 'instagramUrl', 'threadsUrl',
        'tiktokUrl', 'youtubeUrl', 'discordUrl', 'twitchUrl', 'snapchatUrl',
        'telegramUrl', 'whatsappUrl', 'blueskyUrl'
      ];
      const existingSocialLinks = socialLinks.filter(link => initialData[link as keyof BusinessCardData]);
      console.log('Existing social links:', existingSocialLinks);
      setAdditionalSocialLinks(existingSocialLinks);
    }
  }, [initialData]);

  useEffect(() => {
    console.log('Form data:', formData);
    console.log('Additional social links:', additionalSocialLinks);
  }, [formData, additionalSocialLinks]);

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Adjust this breakpoint as needed
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to determine if a section should be open
  const shouldSectionBeOpen = () => {
    if (!isEditing) return true; // Always open when creating new card
    if (!isMobile) return true; // Always open on desktop
    return false; // Closed on mobile when editing
  };

  const addProtocolToUrl = (url: string): string => {
    if (url && !/^https?:\/\//i.test(url) && url !== 'https://') {
      return `https://${url}`;
    }
    return url;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let updatedValue = value;

    // Add protocol to URL fields if necessary
    if (name.toLowerCase().includes('url') || name === 'linkedIn' || name === 'twitter') {
      updatedValue = addProtocolToUrl(value);
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: updatedValue };
      
      // Call onChange prop if provided
      if (onChange) {
        onChange(newData);
      }
      
      return newData;
    });
  };

  const handleCvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCvFile(file);
      setFormData(prev => {
        const newData = { ...prev, cv: file };
        
        // Call onChange prop if provided
        if (onChange) {
          onChange(newData);
        }
        
        return newData;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Only proceed if the submit button was clicked
    if (e.nativeEvent instanceof SubmitEvent && 
        e.nativeEvent.submitter instanceof HTMLButtonElement && 
        e.nativeEvent.submitter.type === 'submit') {
      setIsSubmitting(true);
      setError(null);

      // Validate the phone number
      const isPhoneValid = validatePhoneNumber();

      if (!isPhoneValid) {
        setIsSubmitting(false);
        return;
      }

      if (!user) {
        setError('User not authenticated');
        setIsSubmitting(false);
        return;
      }
      try {
        const updatedCardData = { ...formData, cv: cvFile || undefined };
        if (imageFile) {
          if (formData.imageUrl) {
            await deleteImage(user.uid, formData.imageUrl);
          }
          const uploadedImageUrl = await uploadImage(user.uid, imageFile);
          updatedCardData.imageUrl = uploadedImageUrl;
        } else if (imageToDelete) {
          await deleteImage(user.uid, imageToDelete);
          updatedCardData.imageUrl = '';
        }
        await onSuccess(updatedCardData);
        setImageToDelete(null); // Reset the imageToDelete state
      } catch (error) {
        console.error('Error saving business card:', error);
        setError('Failed to save business card. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
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

  const availableSocialLinks = [
    { name: 'linkedIn', label: 'LinkedIn', icon: Linkedin },
    { name: 'twitter', label: 'X/Twitter', icon: MyXIcon },
    { name: 'facebookUrl', label: 'Facebook', icon: Facebook },
    { name: 'instagramUrl', label: 'Instagram', icon: Instagram },
    { name: 'youtubeUrl', label: 'YouTube', icon: Youtube },
    { name: 'tiktokUrl', label: 'TikTok', icon: FaTiktok },
    { name: 'discordUrl', label: 'Discord', icon: FaDiscord },
    { name: 'twitchUrl', label: 'Twitch', icon: FaTwitch },
    { name: 'snapchatUrl', label: 'Snapchat', icon: FaSnapchatGhost },
    { name: 'telegramUrl', label: 'Telegram', icon: FaTelegram },
    { name: 'whatsappUrl', label: 'WhatsApp', icon: Phone },
    { name: 'threadsUrl', label: 'Threads', icon: AtSign },
    { name: 'blueskyUrl', label: 'Bluesky', icon: BlueSkyIcon },
  ];

  const handleAddSocialLink = (linkName: string) => {
    setAdditionalSocialLinks([...additionalSocialLinks, linkName]);
    setShowSocialLinkDropdown(false);
    setFormData(prev => {
      const newData = { ...prev, [linkName]: '' };
      
      // Call onChange prop if provided
      if (onChange) {
        onChange(newData);
      }
      
      return newData;
    });
  };

  const handleWebLinkChange = (index: number, field: 'url' | 'displayText', value: string) => {
    setFormData(prev => {
      const updatedWebLinks = [...prev.webLinks];
      
      if (field === 'url') {
        // Remove protocol if the user has cleared the input
        if (value === '' || value === 'http://' || value === 'https://') {
          value = '';
        } else if (!value.match(/^https?:\/\//i)) {
          // Add protocol only if it's not already there
          value = addProtocolToUrl(value);
        }
      }
      
      updatedWebLinks[index] = {
        ...updatedWebLinks[index],
        [field]: value,
      };
      
      const newData = {
        ...prev,
        webLinks: updatedWebLinks,
      };
      
      // Call onChange prop if provided
      if (onChange) {
        onChange(newData);
      }
      
      return newData;
    });
  };

  const addWebLink = () => {
    setFormData(prev => {
      const newData = {
        ...prev,
        webLinks: [...prev.webLinks, { url: '', displayText: '' }],
      };
      
      // Call onChange prop if provided
      if (onChange) {
        onChange(newData);
      }
      
      return newData;
    });
  };

  const removeSocialLink = (linkName: string) => {
    if (confirm(`Are you sure you want to remove this ${linkName} link?`)) {
      setAdditionalSocialLinks(additionalSocialLinks.filter(link => link !== linkName));
      setFormData(prev => {
        const newData = { ...prev, [linkName]: '' };
        
        // Call onChange prop if provided
        if (onChange) {
          onChange(newData);
        }
        
        return newData;
      });
    }
  };

  const removeWebLink = (index: number) => {
    if (confirm('Are you sure you want to remove this web link?')) {
      setFormData(prev => {
        const newData = {
          ...prev,
          webLinks: prev.webLinks.filter((_, i) => i !== index),
        };
        
        // Call onChange prop if provided
        if (onChange) {
          onChange(newData);
        }
        
        return newData;
      });
    }
  };

  const handleCvDelete = async () => {
    if (!user || !formData.id) return;

    try {
      await deleteCv(user.uid, formData.id);
      setCvFile(null);
      setFormData(prevData => ({ ...prevData, cvUrl: '' }));
      // Show success message to user
    } catch (error) {
      console.error('Error deleting CV:', error);
      // Show error message to user
    }
  };

  const handleCopyUrl = () => {
    if (formData.cvUrl) {
      navigator.clipboard.writeText(formData.cvUrl);
      setShowCopyTooltip(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setShowCopyTooltip(false), 2000);
    }
  };

  const validatePhoneNumber = () => {
    const { phoneNumber } = formData;

    if (!phoneNumber) {
      // Phone number is optional, so if it's empty, consider it valid
      return true;
    }

    const phoneNumberObj = parsePhoneNumberFromString(phoneNumber);

    if (phoneNumberObj && phoneNumberObj.isValid()) {
      // Valid number
      const formattedNumber = phoneNumberObj.formatInternational();

      setFormData((prevState) => ({
        ...prevState,
        phoneNumber: formattedNumber,
      }));

      return true;
    } else {
      // Invalid number
      setError('Please enter a valid phone number, including the country code, or leave it blank.');
      return false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      const form = e.target.form;
      if (form) {
        const index = Array.prototype.indexOf.call(form, e.target);
        const nextElement = form.elements[index + 1] as HTMLElement | null;
        if (nextElement) {
          nextElement.focus();
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

      {/* First Section - Always Open */}
      <CollapsibleSection title="Card Description" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="description" className="block text-xs mb-1 font-bold text-gray-400">
              Card Label *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Card Description (e.g., Work, Personal, Side Biz, etc.)"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
              required
            />
            <p className="text-xs text-gray-500 italic">
              Note: This is for your reference only and will not be visible on your digital business card.
            </p>
          </div>
        </div>
      </CollapsibleSection>
      {/* Second Section - Always Open */}
      <CollapsibleSection title="Basic Information" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs mb-1 font-bold text-gray-400">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="First Name"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                onKeyDown={handleKeyDown}
                placeholder="Middle Name"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                onKeyDown={handleKeyDown}
                placeholder="Last Name"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobTitle" className="block text-xs mb-1 font-bold text-gray-400">Job Title</label>
              <input
                id="jobTitle"
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Job Title"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                onKeyDown={handleKeyDown}
                placeholder="Company"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                onKeyDown={handleKeyDown}
                placeholder="Pronouns"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                onKeyDown={handleKeyDown}
                placeholder="Prefix"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
                onKeyDown={handleKeyDown}
                placeholder="Credentials"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
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
              onKeyDown={handleKeyDown}
              placeholder="About Me"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
              rows={3}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Remaining Sections - Open if editing, closed if creating */}
      <CollapsibleSection title="Contact Information" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-xs mb-1 font-bold text-gray-400">Phone Number</label>
              <ReactPhoneInput
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(value) => setFormData({ ...formData, phoneNumber: value || '' })}
                defaultCountry="US" // Change as needed
                international
                countryCallingCodeEditable={true}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm phone-input-custom"
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
                onKeyDown={handleKeyDown}
                placeholder="Email"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
              />
            </div>
          </div>
          <div className="mt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="enableTextMessage"
                checked={formData.enableTextMessage}
                onChange={(e) => setFormData({ ...formData, enableTextMessage: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Enable &quot;Send a text&quot; Button</span>
            </label>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Social Links" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div className="overflow-y-auto">
            {additionalSocialLinks.map((link) => {
              const socialLink = availableSocialLinks.find(sl => sl.name === link);
              const IconComponent = socialLink?.icon || LinkIcon;
              return (
                <div key={link} className="flex items-center space-x-2 mb-2">
                  <IconComponent size={16} className="text-gray-400" />
                  <input
                    type={link === 'twitter' ? 'text' : 'url'}
                    name={link}
                    value={formData[link as keyof BusinessCardData] as string}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`${socialLink?.label || 'Social'} ${link === 'twitter' ? 'Handle' : 'URL'}`}
                    className="flex-grow px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialLink(link)}
                    className="text-gray-400 hover:text-[#FF6A42] transition-colors"
                  >
                    <XIcon size={16} className="text-gray-400" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSocialLinkDropdown(!showSocialLinkDropdown)}
              className="bg-blue-500 text-white dark:text-[var(--button-text-dark)] px-4 py-1.5 rounded-full text-sm flex items-center mt-2 min-w-[140px] justify-center"
            >
              <Plus size={16} className="mr-2" />
              Add Social Link
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Move the dropdown outside of the CollapsibleSection */}
      {showSocialLinkDropdown && (
        <div className="inline-block align-bottom bg-white dark:bg-[#40444b] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-[#40444b] px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
            <button
              onClick={() => setShowSocialLinkDropdown(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-500 dark:text-[var(--body-primary-text)] dark:hover:text-[var(--primary-text)] focus:outline-none"
            >
              <XIcon size={20} className="text-gray-400" />
            </button>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-[var(--body-primary-text)]" id="modal-title">
                  Add Social Link
                </h3>
                <div className="mt-2">
                  {availableSocialLinks
                    .filter((link) => !additionalSocialLinks.includes(link.name))
                    .map((link) => (
                      <button
                        key={link.name}
                        type="button"
                        onClick={() => {
                          handleAddSocialLink(link.name);
                          setShowSocialLinkDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[var(--primary-hover)] flex items-center text-sm text-gray-700 dark:text-[var(--body-primary-text)]"
                      >
                        <link.icon size={16} className="mr-2 text-gray-400 dark:text-[var(--social-icon-color)]" />
                        <span className="truncate">{link.label}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CollapsibleSection title="Web Links" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div className="overflow-y-auto">
            {formData.webLinks.map((link, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <LinkIcon size={16} className="text-gray-400" />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleWebLinkChange(index, 'url', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="URL"
                  className="flex-grow px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
                />
                <input
                  type="text"
                  value={link.displayText}
                  onChange={(e) => handleWebLinkChange(index, 'displayText', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Display Text"
                  className="flex-grow px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
                />
                <button
                  type="button"
                  onClick={() => removeWebLink(index)}
                  className="text-gray-400 hover:text-[#FF6A42] transition-colors"
                >
                  <XIcon size={16} className="text-gray-400" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addWebLink}
            className="bg-blue-500 text-white dark:text-[var(--button-text-dark)] px-4 py-1.5 rounded-full text-sm flex items-center mt-2 min-w-[140px] justify-center"
          >
            <Plus size={16} className="mr-2" />
            Add Web Link
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Profile Image Upload" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="image" className="block text-xs font-medium text-gray-400">
              Upload Image
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                id="image"
                name="image"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert("File size must be less than 5MB");
                      e.target.value = '';
                      return;
                    }
                    setImageFile(file);
                    setImageUrl(URL.createObjectURL(file));
                  }
                }}
                accept="image/jpeg,image/png,image/gif"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
              />
            </div>
            <p className="text-xs text-gray-500 italic">Accepted formats: JPEG, PNG, GIF. Max size: 5MB</p>
          </div>
          {(imageFile || imageUrl) && (
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={imageUrl || formData.imageUrl || ''}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (formData.imageUrl) {
                    setImageToDelete(formData.imageUrl);
                  }
                  setImageFile(null);
                  setImageUrl(null);
                  setFormData(prevData => ({ ...prevData, imageUrl: '' }));
                }}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                Remove Image
              </button>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Custom Header & Message" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div>
            <label htmlFor="customMessageHeader" className="block text-xs mb-1 font-bold text-gray-400">Custom Message Header</label>
            <input
              id="customMessageHeader"
              name="customMessageHeader"
              value={formData.customMessageHeader}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Custom Message Header (optional)"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
            />
          </div>
          <div>
            <label htmlFor="customMessage" className="block text-xs mb-1 font-bold text-gray-400">Custom Message</label>
            <textarea
              id="customMessage"
              name="customMessage"
              value={formData.customMessage}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Custom Message"
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Document" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="cv" className="block text-xs font-medium text-gray-400">
              Upload Document {!isPro && (
                <Link 
                  href="/get-helix-pro" 
                  className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
                >
                  (Get Helix Pro to upload a document)
                </Link>
              )}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                id="cv"
                name="cv"
                onChange={handleCvUpload}
                accept=".pdf"
                className={`w-full px-2 py-1 border border-gray-300 rounded-md text-xs ${!isPro && 'opacity-50 cursor-not-allowed'}`}
                disabled={!isPro}
              />
            </div>
            <p className="text-xs text-gray-500 italic">Document must be a PDF</p>
          </div>
          {(cvFile || formData.cvUrl) && (
            <div className="flex items-center space-x-6 text-sm">
              {formData.cvUrl && (
                <>
                  <a
                    href={formData.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[var(--body-primary-text)] hover:underline flex items-center ${!isPro && 'pointer-events-none opacity-50'}`}
                  >
                    <Eye size={16} className="mr-2 text-gray-400" /> View Document
                  </a>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className={`text-[var(--body-primary-text)] hover:underline flex items-center ${!isPro && 'opacity-50 cursor-not-allowed'}`}
                      disabled={!isPro}
                    >
                      <Copy size={16} className="mr-2 text-gray-400" /> Copy URL
                    </button>
                    {showCopyTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                        URL Copied!
                      </div>
                    )}
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={handleCvDelete}
                className={`text-red-500 hover:text-red-700 transition-colors flex items-center ${!isPro && 'opacity-50 cursor-not-allowed'}`}
                disabled={!isPro}
              >
                <Trash2 size={16} className="mr-2" /> Delete Document
              </button>
            </div>
          )}
          <div>
            <label htmlFor="cvHeader" className="block text-xs mb-1 font-bold text-gray-400">Document Header</label>
            <input
              id="cvHeader"
              name="cvHeader"
              value={formData.cvHeader}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Defaults to 'Documents' if left blank"
              className={`w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)] ${!isPro && 'opacity-50 cursor-not-allowed'}`}
              disabled={!isPro}
            />
          </div>
          <div>
            <label htmlFor="cvDescription" className="block text-xs mb-1 font-bold text-gray-400">Document Description</label>
            <textarea
              id="cvDescription"
              name="cvDescription"
              value={formData.cvDescription}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Doc Description (optional)"
              className={`w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)] ${!isPro && 'opacity-50 cursor-not-allowed'}`}
              rows={2}
              disabled={!isPro}
            />
          </div>
          <div>
            <label htmlFor="cvDisplayText" className="block text-xs mb-1 font-bold text-gray-400">Document Display Text</label>
            <input
              id="cvDisplayText"
              name="cvDisplayText"
              value={formData.cvDisplayText}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Defaults to 'View Document' if left blank"
              className={`w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)] ${!isPro && 'opacity-50 cursor-not-allowed'}`}
              disabled={!isPro}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Appearance" isOpen={true}>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-3 max-w-xl">
              {/* Classic Theme */}
              <div
                className={`relative bg-white dark:bg-[#2c2d31] rounded-xl p-4 cursor-pointer transition-all border-2 ${
                  formData.theme === 'classic' 
                    ? 'border-[#7CCEDA]' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleChange({ 
                  target: { 
                    name: 'theme', 
                    value: 'classic' 
                  } 
                } as React.ChangeEvent<HTMLInputElement>)}
              >
                <h3 className="text-lg font-bold mb-1">Classic</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Traditional black and white theme</p>
                {formData.theme === 'classic' && (
                  <div className="absolute top-1/2 -translate-y-1/2 right-4">
                    <svg className="w-5 h-5 text-[#7CCEDA]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Modern Theme */}
              <div
                className={`relative bg-white dark:bg-[#2c2d31] rounded-xl p-4 cursor-pointer transition-all border-2 ${
                  formData.theme === 'modern' 
                    ? 'border-[#7CCEDA]' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleChange({ 
                  target: { 
                    name: 'theme', 
                    value: 'modern' 
                  } 
                } as React.ChangeEvent<HTMLInputElement>)}
              >
                <h3 className="text-lg font-bold mb-1">Modern</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">A modern look with blue-green accents</p>
                {formData.theme === 'modern' && (
                  <div className="absolute top-1/2 -translate-y-1/2 right-4">
                    <svg className="w-5 h-5 text-[#7CCEDA]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Dark Theme */}
              <div
                className={`relative bg-white dark:bg-[#2c2d31] rounded-xl p-4 cursor-pointer transition-all border-2 ${
                  formData.theme === 'dark' 
                    ? 'border-[#7CCEDA]' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleChange({ 
                  target: { 
                    name: 'theme', 
                    value: 'dark' 
                  } 
                } as React.ChangeEvent<HTMLInputElement>)}
              >
                <h3 className="text-lg font-bold mb-1">Dark</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dark colors with shades of black and gray</p>
                {formData.theme === 'dark' && (
                  <div className="absolute top-1/2 -translate-y-1/2 right-4">
                    <svg className="w-5 h-5 text-[#7CCEDA]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <div className="flex justify-between items-center">
        {isSubmitting ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <button 
            type="submit" 
            className="bg-primary text-black px-4 py-2 rounded-full hover:bg-primary-hover"
          >
            Save Changes
          </button>
        )}
        
        {initialData && (
          <div className="relative group">
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 transition-colors"
              aria-label="Delete card"
            >
              <Trash2 size={25} />
            </button>
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Danger! Clicking here will delete this card.
            </span>
          </div>
        )}
      </div>
    </form>
  );
};
