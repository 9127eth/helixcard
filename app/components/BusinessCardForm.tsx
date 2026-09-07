import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deleteCv } from '../lib/firebaseOperations';
import { uploadImage, deleteImage } from '../lib/uploadUtils';
import Image from 'next/image';
import CollapsibleSection from './CollapsibleSection';
import {
  Linkedin, Facebook, Instagram, Youtube,
  Link as LinkIcon, Plus, AtSign, Eye, Copy, Trash2, Phone,
  Tag, User, Share2, Camera, MessageSquare, FileText, Layers,
  Check, Lock, Upload, AlertCircle, Smartphone, MousePointer,
} from 'react-feather';
import { FaTiktok, FaTwitch, FaSnapchatGhost, FaTelegram, FaDiscord } from 'react-icons/fa';
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // Import the library
import ReactPhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Link from 'next/link';
import { X as XIcon } from 'react-feather';
import { MyXIcon } from './MyIcons';
import { BusinessCard, CardTheme, CardEffect, CardColors } from '../types';
import { CARD_THEMES } from '../lib/cardThemes';
import { CARD_EFFECTS, DEFAULT_CARD_EFFECT, isProCardEffect } from '../lib/cardEffects';
import { getCardColorDefaults, normalizeCardColors } from '../lib/cardColors';
import CardColorEditor from './CardColorEditor';
import LiveCardPreview from './LiveCardPreview';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import {
  inputClass, labelClass, hintClass, legendClass, iconTileClass,
  btnPrimary, btnSecondary, btnGhost, btnDangerGhost, addButtonClass, removeButtonClass,
  Field, ProBadge,
} from './ui/editor';

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
  effect?: CardEffect;
  effectTour?: boolean;
  customColors?: CardColors | null;
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
    effect: CARD_EFFECTS.find(option => option.id === initialData?.effect)?.id ?? DEFAULT_CARD_EFFECT,
    effectTour: initialData?.effectTour !== false,
    customColors: initialData?.customColors ?? null,
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
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
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
      setAdditionalSocialLinks(existingSocialLinks);
    }
  }, [initialData]);

  useEffect(() => {
    setIsPro(false);
    if (!db || !user) return;
    return onSnapshot(doc(db, 'users', user.uid), snapshot => {
      setIsPro(snapshot.data()?.isPro === true);
    }, () => setIsPro(false));
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
        setError(error instanceof Error ? error.message : 'Failed to save business card. Please try again.');
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
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 text-sm text-gray-600 shadow-sm dark:border-white/10 dark:bg-[#2c2d31] dark:text-gray-300">
        Please log in to create or edit a business card.
      </div>
    );
  }

  const colors = normalizeCardColors(formData.customColors);
  const previewCard: BusinessCard = {
    ...formData,
    id: formData.id || 'preview',
    username: '',
    firstName: formData.firstName || 'Your name',
    imageUrl: imageUrl || '',
    isActive: true,
  };

  const updateAppearance = (changes: Partial<Pick<BusinessCardData, 'theme' | 'effect' | 'effectTour' | 'customColors'>>) => {
    const next = { ...formData, ...changes };
    setFormData(next);
    onChange?.(next);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
    <form onSubmit={handleSubmit} className="min-w-0 space-y-4 text-sm lg:col-start-1 lg:row-start-1">

      {/* Card label */}
      <CollapsibleSection
        title="Card Description"
        description="A private label so you can tell your cards apart."
        icon={<Tag size={16} />}
        isOpen={shouldSectionBeOpen()}
      >
        <Field label="Card Label" htmlFor="description" required hint="For your reference only. It never appears on your card.">
          <input
            id="description"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Work, Personal, Side Biz"
            className={inputClass}
            required
          />
        </Field>
      </CollapsibleSection>

      {/* Basic information */}
      <CollapsibleSection
        title="Basic Information"
        description="Who you are and what you do."
        icon={<User size={16} />}
        isOpen={shouldSectionBeOpen()}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Field label="First Name" htmlFor="firstName" required>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="First name"
                className={inputClass}
                required
              />
            </Field>
            <Field label="Middle Name" htmlFor="middleName">
              <input
                id="middleName"
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Middle name"
                className={inputClass}
              />
            </Field>
            <Field label="Last Name" htmlFor="lastName">
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Last name"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Job Title" htmlFor="jobTitle">
              <input
                id="jobTitle"
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Job title"
                className={inputClass}
              />
            </Field>
            <Field label="Company" htmlFor="company">
              <input
                id="company"
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Company"
                className={inputClass}
              />
            </Field>
            <Field label="Pronouns" htmlFor="pronouns">
              <input
                id="pronouns"
                type="text"
                name="pronouns"
                value={formData.pronouns}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g. she/her"
                className={inputClass}
              />
            </Field>
            <Field label="Prefix" htmlFor="prefix">
              <input
                id="prefix"
                type="text"
                name="prefix"
                value={formData.prefix}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Dr."
                className={inputClass}
              />
            </Field>
            <Field label="Credentials" htmlFor="credentials">
              <input
                id="credentials"
                type="text"
                name="credentials"
                value={formData.credentials}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g. MBA, PhD"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="About Me" htmlFor="aboutMe">
            <textarea
              id="aboutMe"
              name="aboutMe"
              value={formData.aboutMe}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="A short introduction"
              className={`${inputClass} min-h-[88px] resize-y`}
              rows={3}
            />
          </Field>
        </div>
      </CollapsibleSection>

      {/* Contact */}
      <CollapsibleSection
        title="Contact Information"
        description="How people can reach you."
        icon={<Phone size={16} />}
        isOpen={shouldSectionBeOpen()}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone Number" htmlFor="phoneNumber">
              <ReactPhoneInput
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(value) => setFormData({ ...formData, phoneNumber: value || '' })}
                defaultCountry="US" // Change as needed
                international
                countryCallingCodeEditable={true}
                className={`${inputClass} phone-input-custom`}
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                className={inputClass}
              />
            </Field>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/[0.06] bg-gray-50/70 p-3.5 transition hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20">
            <input
              type="checkbox"
              name="enableTextMessage"
              checked={formData.enableTextMessage}
              onChange={(e) => setFormData({ ...formData, enableTextMessage: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#3B8A99] focus:ring-4 focus:ring-[#7CCEDA]/30"
            />
            <span>
              <span className="block text-sm font-medium">Enable &quot;Send a text&quot; button</span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">Lets people open a text message to your number straight from the card.</span>
            </span>
          </label>
        </div>
      </CollapsibleSection>

      {/* Social links */}
      <CollapsibleSection
        title="Social Links"
        description="The platforms you want on your card."
        icon={<Share2 size={16} />}
        isOpen={shouldSectionBeOpen()}
      >
        <div className="space-y-3">
          {additionalSocialLinks.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center text-xs text-gray-500 dark:border-white/15 dark:text-gray-400">
              No social links yet. Add one below.
            </p>
          )}
          <div className="space-y-2">
            {additionalSocialLinks.map((link) => {
              const socialLink = availableSocialLinks.find(sl => sl.name === link);
              const IconComponent = socialLink?.icon || LinkIcon;
              return (
                <div key={link} className="flex items-center gap-2">
                  <span className={iconTileClass} title={socialLink?.label}>
                    <IconComponent size={16} />
                  </span>
                  <input
                    type={link === 'twitter' ? 'text' : 'url'}
                    name={link}
                    value={formData[link as keyof BusinessCardData] as string}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`${socialLink?.label || 'Social'} ${link === 'twitter' ? 'handle' : 'URL'}`}
                    aria-label={`${socialLink?.label || 'Social'} ${link === 'twitter' ? 'handle' : 'URL'}`}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialLink(link)}
                    className={removeButtonClass}
                    aria-label={`Remove ${socialLink?.label || link}`}
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowSocialLinkDropdown(!showSocialLinkDropdown)}
            className={addButtonClass}
          >
            <Plus size={16} />
            Add social link
          </button>
        </div>
      </CollapsibleSection>

      {/* Social link picker */}
      <Dialog open={showSocialLinkDropdown} onOpenChange={setShowSocialLinkDropdown}>
        <DialogContent className="max-w-md rounded-2xl border-black/5 bg-white p-0 font-sans shadow-2xl dark:border-white/10 dark:bg-[#2c2d31] sm:rounded-2xl">
          <div className="px-6 pb-2 pt-6">
            <DialogTitle className="text-lg font-semibold tracking-tight">Add a social link</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pick a platform. You can add the link right after.
            </DialogDescription>
          </div>
          <div className="grid grid-cols-2 gap-2 px-6 pb-6 pt-2 sm:grid-cols-3">
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
                  className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-gray-50/70 px-3 py-2.5 text-left text-sm font-medium transition hover:border-[#7CCEDA] hover:bg-[#7CCEDA]/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/30 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-[#7CCEDA]/10"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10">
                    <link.icon size={16} />
                  </span>
                  <span className="truncate">{link.label}</span>
                </button>
              ))}
            {availableSocialLinks.every((link) => additionalSocialLinks.includes(link.name)) && (
              <p className="col-span-full py-4 text-center text-sm text-gray-500 dark:text-gray-400">You&apos;ve added every platform.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Web links */}
      <CollapsibleSection
        title="Web Links"
        description="Your website, portfolio, booking page. Anything with a URL."
        icon={<LinkIcon size={16} />}
        isOpen={shouldSectionBeOpen()}
      >
        <div className="space-y-3">
          {formData.webLinks.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center text-xs text-gray-500 dark:border-white/15 dark:text-gray-400">
              No web links yet. Add one below.
            </p>
          )}
          <div className="space-y-2">
            {formData.webLinks.map((link, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className={`${iconTileClass} mt-0`}>
                  <LinkIcon size={16} />
                </span>
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleWebLinkChange(index, 'url', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://example.com"
                    aria-label={`Web link ${index + 1} URL`}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={link.displayText}
                    onChange={(e) => handleWebLinkChange(index, 'displayText', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Display text"
                    aria-label={`Web link ${index + 1} display text`}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeWebLink(index)}
                  className={removeButtonClass}
                  aria-label={`Remove web link ${index + 1}`}
                >
                  <XIcon size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addWebLink}
            className={addButtonClass}
          >
            <Plus size={16} />
            Add web link
          </button>
        </div>
      </CollapsibleSection>

      {/* Profile image */}
      <CollapsibleSection
        title="Profile Image Upload"
        description="Shown at the top of your card."
        icon={<Camera size={16} />}
        isOpen={shouldSectionBeOpen()}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100 shadow-inner ring-4 ring-white dark:bg-white/5 dark:ring-white/10">
            {(imageFile || imageUrl) ? (
              <Image
                src={imageUrl || formData.imageUrl || ''}
                alt="Profile"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-gray-400">
                <User size={32} />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="image" className={`${btnSecondary} cursor-pointer`}>
                <Upload size={15} />
                {(imageFile || imageUrl) ? 'Replace image' : 'Upload image'}
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
                  className="sr-only"
                />
              </label>
              {(imageFile || imageUrl) && (
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
                  className={btnDangerGhost}
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              )}
            </div>
            <p className={hintClass}>JPEG, PNG or GIF. Max size 5MB. A square image looks best.</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Custom header & message */}
      <CollapsibleSection
        title="Custom Header & Message"
        description="A personal note for people who open your card."
        icon={<MessageSquare size={16} />}
        isOpen={shouldSectionBeOpen()}
      >
        <div className="space-y-4">
          <Field label="Custom Message Header" htmlFor="customMessageHeader">
            <input
              id="customMessageHeader"
              name="customMessageHeader"
              value={formData.customMessageHeader}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Let's work together"
              className={inputClass}
            />
          </Field>
          <Field label="Custom Message" htmlFor="customMessage">
            <textarea
              id="customMessage"
              name="customMessage"
              value={formData.customMessage}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Your message"
              className={`${inputClass} min-h-[72px] resize-y`}
              rows={2}
            />
          </Field>
        </div>
      </CollapsibleSection>

      {/* Document */}
      <CollapsibleSection
        title="Document"
        description="Attach a PDF such as a résumé, menu, or brochure."
        icon={<FileText size={16} />}
        badge={<ProBadge muted={isPro} />}
        isOpen={shouldSectionBeOpen()}
      >
        <div className="space-y-4">
          {!isPro && (
            <div className="flex items-start gap-3 rounded-xl border border-[#7CCEDA]/40 bg-[#7CCEDA]/10 p-3.5 text-sm dark:border-[#7CCEDA]/30 dark:bg-[#7CCEDA]/10">
              <Lock size={16} className="mt-0.5 shrink-0 text-[#2E7C89] dark:text-[#7CCEDA]" />
              <p className="text-gray-700 dark:text-gray-200">
                Documents are a Helix Pro feature.{' '}
                <Link href="/get-helix-pro" className="font-semibold text-[#2E7C89] underline decoration-[#7CCEDA]/60 underline-offset-2 hover:decoration-[#7CCEDA] dark:text-[#7CCEDA]">
                  Get Helix Pro
                </Link>{' '}
                to upload a document.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <span className={labelClass}>Upload Document</span>
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="cv"
                className={`${btnSecondary} ${!isPro ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                aria-disabled={!isPro}
              >
                <Upload size={15} />
                {cvFile ? 'Replace PDF' : 'Upload PDF'}
                <input
                  type="file"
                  id="cv"
                  name="cv"
                  onChange={handleCvUpload}
                  accept=".pdf"
                  className="sr-only"
                  disabled={!isPro}
                />
              </label>
              {cvFile && (
                <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs text-gray-700 dark:bg-white/5 dark:text-gray-200">
                  <FileText size={13} className="shrink-0 text-gray-400" />
                  <span className="truncate">{cvFile.name}</span>
                </span>
              )}
            </div>
            <p className={hintClass}>Document must be a PDF.</p>
          </div>

          {formData.cvUrl && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.06] bg-gray-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <span className={iconTileClass}>
                <FileText size={16} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">Current document</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <a
                  href={formData.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btnGhost} ${!isPro && 'pointer-events-none opacity-50'}`}
                >
                  <Eye size={15} /> View
                </a>
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className={`${btnGhost} ${!isPro && 'opacity-50 cursor-not-allowed'}`}
                    disabled={!isPro}
                  >
                    <Copy size={15} /> Copy URL
                  </button>
                  {showCopyTooltip && (
                    <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg">
                      Copied!
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCvDelete}
                  className={`${btnDangerGhost} ${!isPro && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!isPro}
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          )}

          {/* Local file selected but nothing saved yet: keep the delete action reachable as before */}
          {cvFile && !formData.cvUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCvDelete}
                className={`${btnDangerGhost} ${!isPro && 'opacity-50 cursor-not-allowed'}`}
                disabled={!isPro}
              >
                <Trash2 size={15} /> Delete Document
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Document Header" htmlFor="cvHeader">
              <input
                id="cvHeader"
                name="cvHeader"
                value={formData.cvHeader}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Defaults to 'Documents'"
                className={inputClass}
                disabled={!isPro}
              />
            </Field>
            <Field label="Document Display Text" htmlFor="cvDisplayText">
              <input
                id="cvDisplayText"
                name="cvDisplayText"
                value={formData.cvDisplayText}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Defaults to 'View Document'"
                className={inputClass}
                disabled={!isPro}
              />
            </Field>
          </div>
          <Field label="Document Description" htmlFor="cvDescription">
            <textarea
              id="cvDescription"
              name="cvDescription"
              value={formData.cvDescription}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="A short description (optional)"
              className={`${inputClass} min-h-[72px] resize-y`}
              rows={2}
              disabled={!isPro}
            />
          </Field>
        </div>
      </CollapsibleSection>

      {/* Appearance */}
      <CollapsibleSection
        title="Appearance"
        description="Design, colors, and interactive effects."
        icon={<Layers size={16} />}
        isOpen={true}
      >
        <div className="space-y-7">
          {/* Design */}
          <fieldset className="space-y-3">
            <legend className={legendClass}>Design</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CARD_THEMES.map(option => {
                const selected = formData.theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => updateAppearance({ theme: option.id })}
                    className={`group relative rounded-2xl border-2 p-2 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 ${selected ? 'border-[#7CCEDA] bg-[#7CCEDA]/5 shadow-[0_8px_24px_-12px_rgba(124,206,218,0.8)]' : 'border-black/[0.06] hover:border-gray-300 dark:border-white/10 dark:hover:border-white/25'}`}
                    title={option.description}
                  >
                    <span
                      className="block h-16 rounded-xl ring-1 ring-inset ring-black/10 transition group-hover:scale-[1.01]"
                      style={{ background: option.preview }}
                    />
                    <span className="mt-2 flex items-center justify-between gap-2 px-1 pb-0.5">
                      <span className="text-sm font-semibold">{option.name}</span>
                      {selected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7CCEDA] text-gray-900">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Custom colors */}
          <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-gray-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-3">
                <span className="relative inline-flex shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={Boolean(colors)}
                    disabled={!isPro}
                    onChange={event => updateAppearance({ customColors: event.target.checked ? getCardColorDefaults(formData.theme) : null })}
                    className="peer sr-only"
                  />
                  <span className="h-6 w-11 rounded-full bg-gray-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:bg-[#3B8A99] peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-[#7CCEDA]/40 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:bg-white/20" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Custom colors</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Override the design with your own palette.</span>
                </span>
              </label>
              <ProBadge muted={isPro} />
            </div>
            {!isPro ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <Link href="/get-helix-pro" className="font-semibold text-[#2E7C89] underline decoration-[#7CCEDA]/60 underline-offset-2 dark:text-[#7CCEDA]">Upgrade to Pro</Link> to customize your card colors and unlock every effect.
                {colors && ' Your saved colors are kept and will return when you upgrade.'}
              </p>
            ) : colors ? (
              <>
                <CardColorEditor colors={colors} onChange={customColors => updateAppearance({ customColors })} />
                <button
                  type="button"
                  className="text-xs font-medium text-gray-600 underline decoration-gray-300 underline-offset-2 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  onClick={() => updateAppearance({ customColors: null })}
                >
                  Restore design colors
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose your own colors and watch your card update in the live preview.</p>
            )}
          </div>

          {/* Effects */}
          <fieldset className="space-y-3">
            <legend className={legendClass}>Special Effects</legend>
            <p className="text-sm text-gray-600 dark:text-gray-400">Try effects in the live preview. Portal · The Grid and Repel are free.</p>
            {!isPro && isProCardEffect(formData.effect || DEFAULT_CARD_EFFECT) && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>Your saved Pro effect is paused. Upgrade to use it again, or choose a free effect.</span>
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Free effects first (a stable sort keeps the registry order within each group). */}
              {[...CARD_EFFECTS].sort((a, b) => Number(isProCardEffect(a.id)) - Number(isProCardEffect(b.id))).map(option => {
                const selected = (formData.effect || DEFAULT_CARD_EFFECT) === option.id;
                const locked = !isPro && isProCardEffect(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={locked}
                    aria-pressed={selected}
                    onClick={() => updateAppearance({ effect: option.id })}
                    className={`relative rounded-2xl border-2 p-3.5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/40 disabled:cursor-not-allowed disabled:opacity-60 ${selected ? 'border-[#7CCEDA] bg-[#7CCEDA]/5 shadow-[0_8px_24px_-12px_rgba(124,206,218,0.8)]' : 'border-black/[0.06] hover:border-gray-300 dark:border-white/10 dark:hover:border-white/25'}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-semibold">
                        {locked && <Lock size={13} className="text-gray-400" />}
                        {option.name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {isProCardEffect(option.id) && <ProBadge muted={isPro} />}
                        {selected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7CCEDA] text-gray-900">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="mt-1.5 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">{option.description}</span>
                    {option.interaction && (
                      <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#7CCEDA]/15 px-2 py-0.5 text-[11px] font-medium text-[#2E7C89] dark:text-[#7CCEDA]">
                        <MousePointer size={11} />
                        {option.interaction}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Effects tour */}
          <div className="space-y-3 rounded-2xl border border-black/[0.06] bg-gray-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-3">
                <span className="relative inline-flex shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={formData.effectTour !== false}
                    disabled={!isPro}
                    onChange={event => updateAppearance({ effectTour: event.target.checked })}
                    className="peer sr-only"
                  />
                  <span className="h-6 w-11 rounded-full bg-gray-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:bg-[#3B8A99] peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-[#7CCEDA]/40 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:bg-white/20" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Let visitors try every effect</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Adds a “Try the other effects” control above the Get Your Card button. Your card always opens with the effect you chose.
                  </span>
                </span>
              </label>
              <ProBadge muted={isPro} />
            </div>
            {!isPro && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Always on for free cards.{' '}
                <Link href="/get-helix-pro" className="font-semibold text-[#2E7C89] underline decoration-[#7CCEDA]/60 underline-offset-2 dark:text-[#7CCEDA]">Upgrade to Pro</Link> to turn it off.
                {formData.effectTour === false && ' Your saved setting is paused, so visitors see the tour until you upgrade.'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-30 pt-2">
        {error && (
          <div role="alert" className="mb-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white/85 px-3 py-3 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.2)] backdrop-blur-md dark:border-white/10 dark:bg-[#2c2d31]/85 sm:px-4">
          {initialData ? (
            <button
              type="button"
              onClick={handleDelete}
              className={btnDangerGhost}
              aria-label="Delete card"
              title="Delete this card"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Delete card</span>
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className={`${btnSecondary} lg:hidden`}
            >
              <Smartphone size={16} />
              Preview
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={btnPrimary}
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  {isEditing ? 'Save changes' : 'Create card'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>

    <LiveCardPreview
      card={previewCard}
      isPro={isPro}
      mobileOpen={previewOpen}
      onMobileClose={() => setPreviewOpen(false)}
    />
    </div>
  );
};
