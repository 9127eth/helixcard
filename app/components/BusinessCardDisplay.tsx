'use client';

import React, { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaTiktok, FaYoutube, FaDiscord, FaTwitch, FaSnapchat, FaTelegram, FaWhatsapp, FaLink, FaPhone, FaEnvelope, FaPaperPlane, FaDownload, FaAt, FaFileAlt } from 'react-icons/fa';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Twitch, MessageCircle, Link as LinkIcon, Phone, Mail, Send, Download, AtSign, FileText } from 'react-feather';
import { BusinessCard } from '@/app/types';
import Link from 'next/link';
import Image from 'next/image';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import LoadingSpinner from './LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface BusinessCardDisplayProps {
  card: BusinessCard;
  isPro: boolean;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, note?: string) => Promise<void>;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSubmit(email, note);
      setSuccess(true);
      // Wait 1.5 seconds before closing to show success message
      setTimeout(() => {
        onClose();
        setEmail('');
        setNote('');
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>Email This Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter email address"
                className={`w-full px-4 py-2 border rounded-lg mb-1 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              {success && (
                <p className="text-green-700 text-sm">Email sent successfully!</p>
              )}
            </div>
            <div className="space-y-1">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? 'Sending...' : success ? 'Sent!' : 'Send'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const XIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

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

const BusinessCardDisplay: React.FC<BusinessCardDisplayProps> = ({ card, isPro }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (card) {
      setIsLoading(false);
    }
  }, [card]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const generateVCard = (card: BusinessCard): string => {
    let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
    
    // Correctly format the full name using firstName, middleName (if available), and lastName (if available)
    let fullName = card.firstName;
    if (card.middleName) fullName += ` ${card.middleName}`;
    if (card.lastName) fullName += ` ${card.lastName}`;
    
    // Add both FN (formatted name) and N (structured name) fields
    vCard += `FN:${fullName}\n`;
    
    // N field format: Last;First;Middle;Prefix;Suffix
    const lastName = card.lastName || '';
    const firstName = card.firstName || '';
    const middleName = card.middleName || '';
    const prefix = card.prefix || '';
    const suffix = card.credentials || '';
    
    vCard += `N:${lastName};${firstName};${middleName};${prefix};${suffix}\n`;
    
    // Company name in the ORG field
    if (card.company) vCard += `ORG:${card.company}\n`;
    
    // The rest remains unchanged
    if (card.jobTitle) vCard += `TITLE:${card.jobTitle}\n`;
    if (card.phoneNumber) vCard += `TEL;TYPE=WORK,VOICE:${card.phoneNumber}\n`;
    if (card.email) vCard += `EMAIL;TYPE=PREF,INTERNET:${card.email}\n`;
    if (card.linkedIn) vCard += `URL;TYPE=LinkedIn:${card.linkedIn}\n`;
    if (card.twitter) vCard += `URL;TYPE=Twitter:${card.twitter}\n`;
    if (card.facebookUrl) vCard += `URL;TYPE=Facebook:${card.facebookUrl}\n`;
    if (card.instagramUrl) vCard += `URL;TYPE=Instagram:${card.instagramUrl}\n`;
    if (card.blueskyUrl) vCard += `URL;TYPE=Bluesky:${card.blueskyUrl}\n`;
    vCard += 'END:VCARD';
    return vCard;
  };

  const handleSaveContact = () => {
    const vCard = generateVCard(card);
    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create a filename that includes firstName, middleName (if available), and lastName (if available)
    let filename = card.firstName;
    if (card.middleName) filename += `_${card.middleName}`;
    if (card.lastName) filename += `_${card.lastName}`;
    
    link.setAttribute('download', `${filename}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatPhoneNumberDisplay = (phoneNumberString: string): string => {
    const phoneNumber = parsePhoneNumberFromString(phoneNumberString);
    if (!phoneNumber) {
      // If parsing fails, return the original string
      return phoneNumberString;
    }

    // Format the number in national format if possible
    return phoneNumber.formatNational();
  };

  const showDocument = isPro && card.cvUrl;

  const handleEmailCard = async (email: string, note?: string) => {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'businessCard',
        email,
        note,
        cardUrl: window.location.href,
        cardOwner: card.firstName,
        ...(card.email && { ownerEmail: card.email }),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  };

  const getThemeClasses = () => {
    switch (card.theme) {
      case 'classic':
        return {
          container: 'classic-theme bg-white dark:bg-[#323338]',
          header: 'bg-white dark:bg-[#2c2d31]',
          buttons: 'bg-black text-white dark:bg-[#40444b] hover:bg-gray-800 dark:hover:bg-[#4a5568]',
          icons: 'text-black dark:text-white',
          socialIcons: 'bg-white dark:bg-[#40444b] border-[0.5px] border-gray-600 dark:border-gray-700',
          footer: 'bg-white dark:bg-[#323338]',
        };
      case 'dark':
        return {
          container: 'dark bg-[#323338]',
          header: 'bg-[#2c2d31]',
          buttons: 'bg-[#40444b] text-white hover:bg-[#4a5568]',
          icons: 'text-white',
          socialIcons: 'bg-[#40444b]',
          footer: 'bg-[#323338]',
        };
      default: // modern
        return {
          container: '',
          header: 'bg-[var(--card-header-bg)]',
          buttons: 'bg-[var(--save-contact-button-bg)] text-[var(--save-contact-button-text)]',
          icons: 'text-[var(--link-icon-color)]',
          socialIcons: 'bg-[var(--social-tile-bg)]',
          footer: 'bg-[var(--end-card-bg)]',
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`${themeClasses.container} w-screen min-h-screen flex flex-col`}>
      <header className={`bg-card-header py-6 sm:py-8 lg:py-10 ${
        card.theme === 'classic' ? 'border-b border-gray-300' : ''
      }`}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-row items-start justify-between pt-2">
            <div className="flex flex-col items-start max-w-[75%]">
              <h1 className="text-3xl font-bold mb-2 text-[var(--header-footer-primary-text)]">
                {card.prefix} {card.firstName} {card.middleName} {card.lastName || ''}
                {(card.credentials || card.pronouns) && (
                  <span className="text-lg ml-2 text-[var(--end-card-header-secondary-text-color)]">
                    {card.credentials}
                    {card.credentials && card.pronouns && " "}
                    {card.pronouns && (
                      <span className="text-sm italic pronouns-spacing">
                        ({card.pronouns})
                      </span>
                    )}
                  </span>
                )}
              </h1>
              <div className="text-lg sm:text-xl text-[var(--header-footer-primary-text)] pr-2">
                <span className="break-words">{card.jobTitle}</span> 
                {card.company && (
                  <span className="text-[var(--end-card-header-secondary-text-color)]">
                    <span> | </span>
                    <span className="break-words">{card.company}</span>
                  </span>
                )}
              </div>
            </div>
            {card.imageUrl && (
              <div className="min-w-24 min-h-24 w-24 h-24 sm:min-w-32 sm:min-h-32 sm:w-32 sm:h-32 rounded-full overflow-hidden relative flex-shrink-0">
                <Image
                  src={card.imageUrl}
                  alt={`${card.firstName} ${card.lastName}`}
                  fill
                  className="object-cover"
                  quality={100}
                  priority
                  sizes="(min-width: 640px) 128px, 96px"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-center space-x-4 mt-8 pb-2">
            <button 
              className="bg-[var(--save-contact-button-bg)] text-[var(--save-contact-button-text)] px-5 py-2 rounded-full flex items-center hover:opacity-80 transition duration-300 text-sm"
              onClick={() => setShowEmailModal(true)}
            >
              <Mail className="mr-2" size={18} />
              Email This Card
            </button>
            <button 
              className="bg-[var(--save-contact-button-bg)] text-[var(--save-contact-button-text)] px-5 py-2 rounded-full flex items-center hover:opacity-80 transition duration-300 text-sm"
              onClick={handleSaveContact}
            >
              <Download className="mr-2" size={18} />
              Save Contact
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-4">
          {/* Social Links and Contact Info */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-2">
              {/* Contact Information */}
              {(card.phoneNumber || card.email) && (
                <div>
                  <h2 className={`text-2xl font-bold mb-4 ${
                    card.theme === 'dark' ? 'text-[#dddee3]' : ''
                  }`}>Contact</h2>
                  {card.phoneNumber && (
                    <>
                      <div className="flex items-center mb-3">
                        <Phone className={`mr-3 ${
                          card.theme === 'classic' ? 'text-gray-600' : 'text-[var(--link-icon-color)]'
                        }`} size={18} />
                        <a href={`tel:${card.phoneNumber}`} className="text-[var(--link-text-color)] hover:underline">
                          {formatPhoneNumberDisplay(card.phoneNumber)}
                        </a>
                      </div>
                      {(card.enableTextMessage === undefined || card.enableTextMessage) && (
                        <div className="flex items-center mb-3">
                          <MessageCircle className={`mr-3 ${
                            card.theme === 'classic' ? 'text-gray-600' : 'text-[var(--link-icon-color)]'
                          }`} size={18} />
                          <a href={`sms:${card.phoneNumber}`} className="text-[var(--link-text-color)] hover:underline">
                            Send a text
                          </a>
                        </div>
                      )}
                    </>
                  )}
                  {card.email && (
                    <div className="flex items-center mb-2">
                      <Mail className={`mr-3 ${
                        card.theme === 'classic' ? 'text-gray-600' : 'text-[var(--link-icon-color)]'
                      }`} size={18} />
                      <a href={`mailto:${card.email}`} className="text-[var(--link-text-color)] hover:underline">
                        {card.email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              {(card.linkedIn || card.twitter || card.facebookUrl || card.instagramUrl || card.threadsUrl || card.blueskyUrl) && (
                <div>
                  <h2 className={`text-2xl font-bold mb-4 ${
                    card.theme === 'dark' ? 'text-[#dddee3]' : ''
                  }`}>Social</h2>
                  <div className="flex flex-wrap gap-8 justify-center">
                    {card.linkedIn && (
                      <div className="flex flex-col items-center">
                        <a 
                          href={card.linkedIn} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`w-14 h-14 ${themeClasses.socialIcons} rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2`}
                        >
                          <Linkedin size={24} className={`${
                            card.theme === 'classic' ? 'text-[var(--social-icon-color)]' : 'text-[var(--social-icon-color)]'
                          }`} />
                        </a>
                        <span className="text-sm text-[var(--social-text-color)]">LinkedIn</span>
                      </div>
                    )}
                    {card.twitter && (
                      <div className="flex flex-col items-center">
                        <a 
                          href={card.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`w-14 h-14 ${themeClasses.socialIcons} rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2`}
                        >
                          <XIcon size={24} className="text-[var(--social-icon-color)]" />
                        </a>
                        <span className="text-sm text-[var(--social-text-color)]">X/Twitter</span>
                      </div>
                    )}
                    {card.facebookUrl && (
                      <div className="flex flex-col items-center">
                        <a 
                          href={card.facebookUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`w-14 h-14 ${themeClasses.socialIcons} rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2`}
                        >
                          <Facebook size={24} className="text-[var(--social-icon-color)]" />
                        </a>
                        <span className="text-sm text-[var(--social-text-color)]">Facebook</span>
                      </div>
                    )}
                    {card.instagramUrl && (
                      <div className="flex flex-col items-center">
                        <a 
                          href={card.instagramUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`w-14 h-14 ${themeClasses.socialIcons} rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2`}
                        >
                          <Instagram size={24} className="text-[var(--social-icon-color)]" />
                        </a>
                        <span className="text-sm text-[var(--social-text-color)]">Instagram</span>
                      </div>
                    )}
                    {card.threadsUrl && (
                      <div className="flex flex-col items-center">
                        <a 
                          href={card.threadsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`w-14 h-14 ${themeClasses.socialIcons} rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2`}
                        >
                          <AtSign size={24} className="text-[var(--social-icon-color)]" />
                        </a>
                        <span className="text-sm text-[var(--social-text-color)]">Threads</span>
                      </div>
                    )}
                    {card.blueskyUrl && (
                      <div className="flex flex-col items-center">
                        <a 
                          href={card.blueskyUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`w-14 h-14 ${themeClasses.socialIcons} rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2`}
                        >
                          <BlueSkyIcon size={24} className="text-[var(--social-icon-color)]" />
                        </a>
                        <span className="text-sm text-[var(--social-text-color)]">Bluesky</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Links Section */}
            {card.webLinks && card.webLinks.length > 0 && card.webLinks.some(link => link.url && link.url.trim() !== '') && (
              <div className="mt-8">
                <h2 className={`text-2xl font-bold mb-4 ${
                  card.theme === 'dark' ? 'text-[#dddee3]' : ''
                }`}>Links</h2>
                <div className="flex flex-col space-y-2">
                  {card.webLinks.filter(link => link.url && link.url.trim() !== '').map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:opacity-80"
                    >
                      <LinkIcon className={`mr-3 ${
                        card.theme === 'classic' ? 'text-gray-600' : 'text-[var(--link-icon-color)]'
                      }`} size={18} />
                      <span className="text-[var(--link-text-color)]">{link.displayText || link.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* About Me and Custom Message */}
          <div className="lg:row-span-2">
            {card.aboutMe && (
              <div className="mt-8 lg:mt-0">
                <h2 className={`text-2xl font-bold mb-4 ${
                  card.theme === 'dark' ? 'text-[#dddee3]' : ''
                }`}>About Me</h2>
                <p className={card.theme === 'dark' ? 'text-[#dcddde]' : ''}>
                  {card.aboutMe}
                </p>
              </div>
            )}

            {card.customMessage && (
              <div className="mt-8">
                {card.customMessageHeader && (
                  <h2 className={`text-2xl font-bold mb-4 ${
                    card.theme === 'dark' ? 'text-[#dddee3]' : ''
                  }`}>{card.customMessageHeader}</h2>
                )}
                <p className={card.theme === 'dark' ? 'text-[#dcddde]' : ''}>
                  {card.customMessage}
                </p>
              </div>
            )}

            {/* Conditionally render the document section */}
            {showDocument && (
              <div className="mt-8">
                <h2 className={`text-2xl font-bold mb-4 ${
                  card.theme === 'dark' ? 'text-[#dddee3]' : ''
                }`}>{card.cvHeader || 'Documents'}</h2>
                {card.cvDescription && (
                  <p className={card.theme === 'dark' ? 'text-[#dcddde]' : ''}>
                    {card.cvDescription}
                  </p>
                )}
                <a
                  href={card.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center hover:opacity-80"
                >
                  <FileText className={`mr-3 ${
                    card.theme === 'classic' ? 'text-gray-600' : 'text-[var(--link-icon-color)]'
                  }`} size={18} />
                  <span className="text-[var(--link-text-color)]">{card.cvDisplayText || 'View document'}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className={`${themeClasses.footer} text-white py-4 sm:py-5 lg:py-6 mt-auto`}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs mb-3 text-[var(--header-footer-secondary-text)]">
            Create a modern, digital business card like this one for free.
          </p>
          <Link 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`inline-block ${themeClasses.buttons} font-bold py-1.5 px-5 rounded-full text-xs transition duration-300 mb-1`}
          >
            Get Your Card
          </Link>
        </div>
      </footer>
      {card.isActive === false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">This card is no longer active.</h2>
            <p className="mb-4">The owner has deactivated this business card.</p>
            <Link 
              href="/" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Create a new free card
            </Link>
          </div>
        </div>
      )}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleEmailCard}
      />
    </div>
  );
};

export default BusinessCardDisplay;
