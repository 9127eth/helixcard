import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deleteCv } from '../lib/firebaseOperations';
import { uploadImage, deleteImage } from '../lib/uploadUtils';
import Image from 'next/image';
import CollapsibleSection from './CollapsibleSection';
import { 
  Linkedin, Twitter, Facebook, Instagram, Youtube, 
  Link, Plus, X, AtSign, Eye, Copy, Trash2, Phone,
} from 'react-feather';
import { FaTiktok, FaTwitch, FaSnapchatGhost, FaTelegram, FaDiscord } from 'react-icons/fa';
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js'; // Import the library
import ReactPhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface BusinessCardFormProps {
  onSuccess: (cardData: BusinessCardData) => Promise<void>;
  initialData?: Partial<BusinessCardData>;
  onDelete?: () => void;
  isEditing?: boolean;
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
}

export const BusinessCardForm: React.FC<BusinessCardFormProps> = ({
  onSuccess,
  initialData,
  onDelete,
  isEditing = false,
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
    webLinks: initialData?.webLinks || [{ url: '', displayText: '' }],
    customMessageHeader: initialData?.customMessageHeader || '',
    threadsUrl: initialData?.threadsUrl || '',
    cvUrl: initialData?.cvUrl || '',
    cvHeader: initialData?.cvHeader || '',
    cvDescription: initialData?.cvDescription || '',
    cvDisplayText: initialData?.cvDisplayText || '',
    imageUrl: initialData?.imageUrl || '',
  });

  const [additionalSocialLinks, setAdditionalSocialLinks] = useState<string[]>([]);
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
        'telegramUrl', 'whatsappUrl'
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
    if (name.toLowerCase().includes('url') || name === 'linkedIn') {
      updatedValue = addProtocolToUrl(value);
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: updatedValue,
    }));
  };

  const handleCvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCvFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    { name: 'twitter', label: 'Twitter', icon: Twitter },
    { name: 'facebookUrl', label: 'Facebook', icon: Facebook },
    { name: 'instagramUrl', label: 'Instagram', icon: Instagram },
    { name: 'tiktokUrl', label: 'TikTok', icon: FaTiktok },
    { name: 'youtubeUrl', label: 'YouTube', icon: Youtube },
    { name: 'discordUrl', label: 'Discord', icon: FaDiscord },
    { name: 'twitchUrl', label: 'Twitch', icon: FaTwitch },
    { name: 'snapchatUrl', label: 'Snapchat', icon: FaSnapchatGhost },
    { name: 'telegramUrl', label: 'Telegram', icon: FaTelegram },
    { name: 'whatsappUrl', label: 'WhatsApp', icon: Phone },
    { name: 'threadsUrl', label: 'Threads', icon: AtSign },
  ];

  const handleAddSocialLink = (linkName: string) => {
    setAdditionalSocialLinks([...additionalSocialLinks, linkName]);
    setShowSocialLinkDropdown(false);
  };

  const handleWebLinkChange = (index: number, field: 'url' | 'displayText', value: string) => {
    setFormData((prevState) => {
      const newWebLinks = [...prevState.webLinks];
      if (field === 'url') {
        // Remove protocol if the user has cleared the input
        if (value === '' || value === 'http://' || value === 'https://') {
          value = '';
        } else if (!value.match(/^https?:\/\//i)) {
          // Add protocol only if it's not already there
          value = addProtocolToUrl(value);
        }
      }
      newWebLinks[index] = { ...newWebLinks[index], [field]: value };
      return { ...prevState, webLinks: newWebLinks };
    });
  };

  const addWebLink = () => {
    setFormData((prevState) => ({
      ...prevState,
      webLinks: [...prevState.webLinks, { url: '', displayText: '' }],
    }));
  };

  const removeSocialLink = (linkName: string) => {
    if (confirm(`Are you sure you want to remove this ${linkName} link?`)) {
      setAdditionalSocialLinks(additionalSocialLinks.filter(link => link !== linkName));
      setFormData(prevState => ({
        ...prevState,
        [linkName]: '',
      }));
    }
  };

  const removeWebLink = (index: number) => {
    if (confirm('Are you sure you want to remove this web link?')) {
      setFormData(prevState => ({
        ...prevState,
        webLinks: prevState.webLinks.filter((_, i) => i !== index),
      }));
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

  // Function to handle phone number changes
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const asYouType = new AsYouType(); // No country code specified for international formatting
    const formattedValue = asYouType.input(value);

    setFormData((prevState) => ({
      ...prevState,
      phoneNumber: formattedValue,
    }));
  };

  const validatePhoneNumber = () => {
    const { phoneNumber } = formData;

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
      setError('Please enter a valid phone number, including the country code.');
      return false;
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
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
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
              <label htmlFor="firstName" className="block text-xs mb-1 font-bold text-gray-400">First Name</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
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
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                required
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
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Social Links" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div className="overflow-y-auto">
            {additionalSocialLinks.map((link) => {
              const socialLink = availableSocialLinks.find(sl => sl.name === link);
              const IconComponent = socialLink?.icon || Link;
              return (
                <div key={link} className="flex items-center space-x-2 mb-2">
                  <IconComponent size={16} className="text-gray-400" />
                  <input
                    type={link === 'twitter' ? 'text' : 'url'}
                    name={link}
                    value={formData[link as keyof BusinessCardData] as string}
                    onChange={handleChange}
                    placeholder={`${socialLink?.label || 'Social'} ${link === 'twitter' ? 'Handle' : 'URL'}`}
                    className="flex-grow px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialLink(link)}
                    className="text-gray-400 hover:text-[#FF6A42] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSocialLinkDropdown(!showSocialLinkDropdown)}
              className="bg-blue-500 text-white dark:text-[var(--button-text-dark)] px-2 py-1 rounded-md text-sm flex items-center mt-2"
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
              <X size={20} />
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
                <Link size={16} className="text-gray-400" />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleWebLinkChange(index, 'url', e.target.value)}
                  placeholder="URL"
                  className="flex-grow px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
                />
                <input
                  type="text"
                  value={link.displayText}
                  onChange={(e) => handleWebLinkChange(index, 'displayText', e.target.value)}
                  placeholder="Display Text"
                  className="flex-grow px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)]"
                />
                <button
                  type="button"
                  onClick={() => removeWebLink(index)}
                  className="text-gray-400 hover:text-[#FF6A42] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addWebLink}
            className="bg-blue-500 text-white dark:text-[var(--button-text-dark)] px-2 py-1 rounded-md text-sm flex items-center mt-2"
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

      <CollapsibleSection title="Custom Header/Message" isOpen={shouldSectionBeOpen()}>
        <div className="space-y-4">
          <div>
            <label htmlFor="customMessageHeader" className="block text-xs mb-1 font-bold text-gray-400">Custom Message Header</label>
            <input
              id="customMessageHeader"
              name="customMessageHeader"
              value={formData.customMessageHeader}
              onChange={handleChange}
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
              Upload Document {!isPro && <span className="text-xs text-gray-500">(Pro feature)</span>}
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
              placeholder="Defaults to 'View Document' if left blank"
              className={`w-full px-2 py-1 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-[var(--input-text)] ${!isPro && 'opacity-50 cursor-not-allowed'}`}
              disabled={!isPro}
            />
          </div>
        </div>
      </CollapsibleSection>

      <div className="flex justify-between items-center">
        <button
          type="submit"
          className="bg-blue-500 text-white dark:text-[var(--button-text-dark)] px-4 py-2 rounded hover:bg-[#40444b] transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        
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