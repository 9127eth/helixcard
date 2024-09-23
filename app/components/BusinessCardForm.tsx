import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faTwitter, faFacebook, faInstagram, faTiktok, faYoutube, faDiscord, faTwitch, faSnapchat, faTelegram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faLink, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

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
  webLinks: { url: string; displayText: string }[];
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
    webLinks: initialData?.webLinks || [{ url: '', displayText: '' }],
  });

  const [additionalSocialLinks, setAdditionalSocialLinks] = useState<string[]>(
    ['linkedIn', 'twitter'] // Initialize with LinkedIn and Twitter
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSocialLinkDropdown, setShowSocialLinkDropdown] = useState(false);

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

  const availableSocialLinks = [
    { name: 'linkedIn', label: 'LinkedIn', icon: faLinkedin },
    { name: 'twitter', label: 'Twitter', icon: faTwitter },
    { name: 'facebookUrl', label: 'Facebook', icon: faFacebook },
    { name: 'instagramUrl', label: 'Instagram', icon: faInstagram },
    { name: 'tiktokUrl', label: 'TikTok', icon: faTiktok },
    { name: 'youtubeUrl', label: 'YouTube', icon: faYoutube },
    { name: 'discordUrl', label: 'Discord', icon: faDiscord },
    { name: 'twitchUrl', label: 'Twitch', icon: faTwitch },
    { name: 'snapchatUrl', label: 'Snapchat', icon: faSnapchat },
    { name: 'telegramUrl', label: 'Telegram', icon: faTelegram },
    { name: 'whatsappUrl', label: 'WhatsApp', icon: faWhatsapp },
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
          {additionalSocialLinks.map((link) => {
            const socialLink = availableSocialLinks.find(sl => sl.name === link);
            return (
              <div key={link} className="flex items-center space-x-2">
                <FontAwesomeIcon icon={socialLink?.icon || faLink} className="w-6 h-6" />
                <input
                  type={link === 'twitter' ? 'text' : 'url'}
                  name={link}
                  value={formData[link as keyof BusinessCardData] as string}
                  onChange={handleChange}
                  placeholder={`${socialLink?.label || 'Social'} ${link === 'twitter' ? 'Handle' : 'URL'}`}
                  className="w-1/2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeSocialLink(link)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            );
          })}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSocialLinkDropdown(!showSocialLinkDropdown)}
              className="bg-blue-500 text-white px-2 py-1 rounded-md text-sm flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Social Link
            </button>
            {showSocialLinkDropdown && (
              <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="grid grid-cols-2 gap-1 p-2">
                  {availableSocialLinks
                    .filter(link => !additionalSocialLinks.includes(link.name))
                    .map(link => (
                      <button
                        key={link.name}
                        type="button"
                        onClick={() => handleAddSocialLink(link.name)}
                        className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded flex items-center text-sm"
                      >
                        <FontAwesomeIcon icon={link.icon} className="mr-2 w-4 h-4" />
                        <span className="truncate">{link.label}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Web Links</h3>
        <div className="space-y-4">
          {formData.webLinks.map((link, index) => (
            <div key={index} className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faLink} className="w-6 h-6" />
              <input
                type="url"
                value={link.url}
                onChange={(e) => handleWebLinkChange(index, 'url', e.target.value)}
                placeholder="URL"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                value={link.displayText}
                onChange={(e) => handleWebLinkChange(index, 'displayText', e.target.value)}
                placeholder="Display Text"
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
              <button
                type="button"
                onClick={() => removeWebLink(index)}
                className="text-red-500 hover:text-red-700"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addWebLink}
            className="bg-blue-500 text-white px-2 py-1 rounded-md text-sm flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Web Link
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">More Options</h3>
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
