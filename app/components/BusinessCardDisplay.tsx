'use client';

import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaTiktok, FaYoutube, FaDiscord, FaTwitch, FaSnapchat, FaTelegram, FaWhatsapp, FaLink, FaPhone, FaEnvelope, FaPaperPlane, FaDownload, FaAt, FaFileAlt } from 'react-icons/fa';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Twitch, MessageCircle, Link as LinkIcon, Phone, Mail, Send, Download, AtSign, FileText } from 'react-feather';
import { BusinessCard } from '@/app/types';
import Link from 'next/link';
import Image from 'next/image';
import { parsePhoneNumberFromString } from 'libphonenumber-js';


interface BusinessCardDisplayProps {
  card: BusinessCard;
  isPro: boolean;
}

const BusinessCardDisplay: React.FC<BusinessCardDisplayProps> = ({ card, isPro }) => {

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
            className="bg-[var(--send-text-button-bg)] text-[var(--send-text-button-text)] px-5 py-3 rounded-md flex items-center hover:opacity-80 transition duration-300 text-sm"
            onClick={() => {
              if (card.phoneNumber) {
                window.location.href = `sms:${card.phoneNumber}`;
              } else {
                alert('No phone number available for this contact.');
              }
            }}
          >
            <Send className="mr-2" size={18} />
            Send a Text
          </button>
          <button 
            className="bg-[var(--save-contact-button-bg)] text-[var(--save-contact-button-text)] px-5 py-3 rounded-md flex items-center hover:opacity-80 transition duration-300 text-sm"
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
                    <p className="flex items-center mb-2">
                      <Phone className="mr-2 text-[var(--link-icon-color)]" size={18} />
                      <a href={`tel:${card.phoneNumber}`} className="text-[var(--link-text-color)] hover:underline">
                        {formatPhoneNumberDisplay(card.phoneNumber)}
                      </a>
                    </p>
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
                  <div className="grid grid-cols-2 gap-4">
                    {card.linkedIn && (
                      <a href={card.linkedIn} target="_blank" rel="noopener noreferrer" className="bg-[var(--social-tile-bg)] p-4 rounded-xl flex flex-col items-center justify-center h-28">
                        <Linkedin size={29} className="mb-2 text-[var(--social-icon-color)]" />
                        <span className="text-[var(--social-text-color)]">LinkedIn</span>
                      </a>
                    )}
                    {card.twitter && (
                      <a href={card.twitter} target="_blank" rel="noopener noreferrer" className="bg-[var(--social-tile-bg)] p-4 rounded-xl flex flex-col items-center justify-center h-28">
                        <Twitter size={29} className="mb-2 text-[var(--social-icon-color)]" />
                        <span className="text-[var(--social-text-color)]">Twitter</span>
                      </a>
                    )}
                    {card.facebookUrl && (
                      <a href={card.facebookUrl} target="_blank" rel="noopener noreferrer" className="bg-[var(--social-tile-bg)] p-4 rounded-xl flex flex-col items-center justify-center h-28">
                        <Facebook size={29} className="mb-2 text-[var(--social-icon-color)]" />
                        <span className="text-[var(--social-text-color)]">Facebook</span>
                      </a>
                    )}
                    {card.instagramUrl && (
                      <a href={card.instagramUrl} target="_blank" rel="noopener noreferrer" className="bg-[var(--social-tile-bg)] p-4 rounded-xl flex flex-col items-center justify-center h-28">
                        <Instagram size={29} className="mb-2 text-[var(--social-icon-color)]" />
                        <span className="text-[var(--social-text-color)]">Instagram</span>
                      </a>
                    )}
                    {card.threadsUrl && (
                      <a href={card.threadsUrl} target="_blank" rel="noopener noreferrer" className="bg-[var(--social-tile-bg)] p-4 rounded-xl flex flex-col items-center justify-center h-28">
                        <AtSign size={29} className="mb-2 text-[var(--social-icon-color)]" />
                        <span className="text-[var(--social-text-color)]">Threads</span>
                      </a>
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
          <h3 className="text-lg font-semibold mb-2 text-[var(--header-footer-primary-text)]">Get Your Own Business Card</h3>
          <p className="text-sm mb-4 text-[var(--header-footer-secondary-text)]">Create a modern, digital business card like this one for free. Get started now!</p>
          <Link 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-md text-sm transition duration-300 mb-6 dark:bg-[#40444b] dark:hover:bg-[#4a4f57]"
          >
            Get Your Card
          </Link>
          <p className="text-xs text-[var(--header-footer-secondary-text)] pb-4">&copy; 2024 HelixCard. All rights reserved.</p>
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
    </div>
  );
};

export default BusinessCardDisplay;