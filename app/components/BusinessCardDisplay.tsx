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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSubmit(email, note);
      onClose();
      setEmail('');
      setNote('');
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
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
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#7CCEDA] text-black rounded-lg hover:opacity-80 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send'}
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
    vCard += `FN:${card.firstName}${card.lastName ? ' ' + card.lastName : ''}\n`;
    vCard += `ORG:${card.company}\n`;
    vCard += `TITLE:${card.jobTitle}\n`;
    if (card.phoneNumber) vCard += `TEL;TYPE=WORK,VOICE:${card.phoneNumber}\n`;
    if (card.email) vCard += `EMAIL;TYPE=PREF,INTERNET:${card.email}\n`;
    if (card.linkedIn) vCard += `URL;TYPE=LinkedIn:${card.linkedIn}\n`;
    if (card.twitter) vCard += `URL;TYPE=Twitter:${card.twitter}\n`;
    if (card.facebookUrl) vCard += `URL;TYPE=Facebook:${card.facebookUrl}\n`;
    if (card.instagramUrl) vCard += `URL;TYPE=Instagram:${card.instagramUrl}\n`;
    vCard += 'END:VCARD';
    return vCard;
  };

  const handleSaveContact = () => {
    const vCard = generateVCard(card);
    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${card.firstName}_${card.lastName}.vcf`);
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

  return (
    <div className="bg-[var(--end-card-bg)] shadow-lg rounded-lg overflow-hidden max-w-full h-full flex flex-col">
      <header className="bg-card-header py-4 sm:py-6 lg:py-8 flex-shrink-0">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-row items-start justify-between">
            <div className="flex flex-col items-start">
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
              <p className="text-lg sm:text-xl text-[var(--header-footer-primary-text)]">
                {card.jobTitle} {card.company && <span className="text-[var(--end-card-header-secondary-text-color)]">| {card.company}</span>}
              </p>
            </div>
            {card.imageUrl && (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden relative">
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex-shrink-0">
        <div className="flex justify-center space-x-4">
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

      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 flex-grow overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Social Links and Contact Info */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-2">
              {/* Contact Information */}
              {(card.phoneNumber || card.email) && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Contact</h2>
                  {card.phoneNumber && (
                    <div className="flex items-center mb-2">
                      <div className="flex items-center flex-grow">
                        <Phone className="mr-2 text-[var(--link-icon-color)]" size={18} />
                        <a href={`tel:${card.phoneNumber}`} className="text-[var(--link-text-color)] hover:underline">
                          {formatPhoneNumberDisplay(card.phoneNumber)}
                        </a>
                        <button
                          className="bg-[var(--social-tile-bg)] text-[var(--social-text-color)] px-3 py-1 rounded-lg flex items-center hover:opacity-80 transition duration-300 text-sm ml-2"
                          onClick={() => {
                            window.location.href = `sms:${card.phoneNumber}`;
                          }}
                        >
                          <Send className="mr-1" size={14} />
                          Send a Text
                        </button>
                      </div>
                    </div>
                  )}
                  {card.email && (
                    <p className="flex items-center mb-2">
                      <Mail className="mr-2 text-[var(--link-icon-color)]" size={18} />
                      <a href={`mailto:${card.email}`} className="text-[var(--link-text-color)] hover:underline">
                        {card.email}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {/* Social Links */}
              {(card.linkedIn || card.twitter || card.facebookUrl || card.instagramUrl || card.threadsUrl) && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Social</h2>
                  <div className="flex flex-wrap gap-8 justify-center">
                    {card.linkedIn && (
                      <div className="flex flex-col items-center">
                        <a 
                          href={card.linkedIn} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-14 h-14 bg-[var(--social-tile-bg)] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2"
                        >
                          <Linkedin size={24} className="text-[var(--social-icon-color)]" />
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
                          className="w-14 h-14 bg-[var(--social-tile-bg)] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2"
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
                          className="w-14 h-14 bg-[var(--social-tile-bg)] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2"
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
                          className="w-14 h-14 bg-[var(--social-tile-bg)] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2"
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
                          className="w-14 h-14 bg-[var(--social-tile-bg)] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity mb-2"
                        >
                          <AtSign size={24} className="text-[var(--social-icon-color)]" />
                        </a>
                        <span className="text-sm text-[var(--social-text-color)]">Threads</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Links Section */}
            {card.webLinks && card.webLinks.length > 0 && card.webLinks.some(link => link.url && link.url.trim() !== '') && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Links</h2>
                <div className="flex flex-col space-y-2">
                  {card.webLinks.filter(link => link.url && link.url.trim() !== '').map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:opacity-80"
                    >
                      <LinkIcon className="mr-2 text-[var(--link-icon-color)]" size={18} />
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
              <div>
                <h2 className="text-2xl font-bold mb-4">About Me</h2>
                <p>{card.aboutMe}</p>
              </div>
            )}

            {card.customMessage && (
              <div className="mt-8">
                {card.customMessageHeader ? (
                  <h2 className="text-2xl font-bold mb-4">{card.customMessageHeader}</h2>
                ) : (
                  <h2 className="text-2xl font-bold mb-4">Custom Message</h2>
                )}
                <p>{card.customMessage}</p>
              </div>
            )}

            {/* Conditionally render the document section */}
            {showDocument && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">{card.cvHeader || 'Documents'}</h2>
                {card.cvDescription && <p>{card.cvDescription}</p>}
                <a
                  href={card.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center hover:opacity-80"
                >
                  <FileText className="mr-2 text-[var(--link-icon-color)]" size={18} />
                  <span className="text-[var(--link-text-color)]">{card.cvDisplayText || 'View document'}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-card-footer text-white py-4 sm:py-6 lg:py-8 mt-4 sm:mt-6 lg:mt-8 flex-shrink-0">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm mb-4 text-[var(--header-footer-secondary-text)]">Create a modern, digital business card like this one for free.</p>
          <Link 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full text-sm transition duration-300 mb-2 dark:bg-[#40444b] dark:hover:bg-[#4a4f57]"
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
