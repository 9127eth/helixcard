'use client';

import React from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaTiktok, FaYoutube, FaDiscord, FaTwitch, FaSnapchat, FaTelegram, FaWhatsapp } from 'react-icons/fa';
import { BusinessCard } from '@/app/types';

interface BusinessCardDisplayProps {
  card: BusinessCard;
}

const BusinessCardDisplay: React.FC<BusinessCardDisplayProps> = ({ card }) => {
  // Remove the useAuth hook if you're not using it
  // const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {card.firstName} {card.middleName} {card.lastName}
              </h1>
              <p className="text-xl">{card.jobTitle}</p>
              <p className="text-gray-400">{card.company}</p>
            </div>
            <div className="mt-4 md:mt-0 space-x-2">
              <button className="bg-blue-500 text-white px-4 py-2 rounded">
                Send a Text
              </button>
              <button className="bg-green-500 text-white px-4 py-2 rounded">
                Save Contact
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Social Links */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Social</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {card.linkedIn && (
                <a href={card.linkedIn} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaLinkedin size={24} className="mr-2" />
                  <span>LinkedIn</span>
                </a>
              )}
              {card.twitter && (
                <a href={card.twitter} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaTwitter size={24} className="mr-2" />
                  <span>Twitter</span>
                </a>
              )}
              {card.facebookUrl && (
                <a href={card.facebookUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaFacebook size={24} className="mr-2" />
                  <span>Facebook</span>
                </a>
              )}
              {card.instagramUrl && (
                <a href={card.instagramUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaInstagram size={24} className="mr-2" />
                  <span>Instagram</span>
                </a>
              )}
              {card.tiktokUrl && (
                <a href={card.tiktokUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaTiktok size={24} className="mr-2" />
                  <span>TikTok</span>
                </a>
              )}
              {card.youtubeUrl && (
                <a href={card.youtubeUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaYoutube size={24} className="mr-2" />
                  <span>YouTube</span>
                </a>
              )}
              {card.discordUrl && (
                <a href={card.discordUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaDiscord size={24} className="mr-2" />
                  <span>Discord</span>
                </a>
              )}
              {card.twitchUrl && (
                <a href={card.twitchUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaTwitch size={24} className="mr-2" />
                  <span>Twitch</span>
                </a>
              )}
              {card.snapchatUrl && (
                <a href={card.snapchatUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaSnapchat size={24} className="mr-2" />
                  <span>Snapchat</span>
                </a>
              )}
              {card.telegramUrl && (
                <a href={card.telegramUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaTelegram size={24} className="mr-2" />
                  <span>Telegram</span>
                </a>
              )}
              {card.whatsappUrl && (
                <a href={card.whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded flex items-center justify-center">
                  <FaWhatsapp size={24} className="mr-2" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* About Me */}
          <div>
            <h2 className="text-2xl font-bold mb-4">About Me</h2>
            <p>{card.aboutMe}</p>
          </div>
        </div>

        {/* Custom Links */}
        {card.webLinks && card.webLinks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
            <div className="flex flex-wrap gap-4">
              {card.webLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-200 px-4 py-2 rounded"
                >
                  {link.displayText || link.url}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Contact</h2>
          <p>{card.email}</p>
          <p>{card.phoneNumber}</p>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {card.firstName} {card.lastName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BusinessCardDisplay;
