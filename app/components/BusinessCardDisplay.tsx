'use client';

import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaTiktok, FaYoutube, FaDiscord, FaTwitch, FaSnapchat, FaTelegram, FaWhatsapp, FaLink, FaPhone, FaEnvelope, FaPaperPlane, FaDownload } from 'react-icons/fa';
import { BusinessCard } from '@/app/types';
import Link from 'next/link';

interface BusinessCardDisplayProps {
  card: BusinessCard;
}

const BusinessCardDisplay: React.FC<BusinessCardDisplayProps> = ({ card }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {card.prefix} {card.firstName} {card.middleName} {card.lastName}
                {card.credentials && <span className="text-lg ml-2 text-gray-400">{card.credentials}</span>}
              </h1>
              <p className="text-xl">{card.jobTitle}</p>
              <p className="text-gray-400">{card.company}</p>
              {card.pronouns && <p className="text-sm italic text-gray-400">{card.pronouns}</p>}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center">
            <FaPaperPlane className="mr-2" />
            Send a Text
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded flex items-center">
            <FaDownload className="mr-2" />
            Save Contact
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Social Links */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Social</h2>
            <div className="grid grid-cols-2 gap-4">
              {card.linkedIn && (
                <a href={card.linkedIn} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded-xl flex flex-col items-center justify-center h-28">
                  <FaLinkedin size={29} className="mb-2" />
                  <span>LinkedIn</span>
                </a>
              )}
              {card.twitter && (
                <a href={card.twitter} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded-xl flex flex-col items-center justify-center h-28">
                  <FaTwitter size={29} className="mb-2" />
                  <span>Twitter</span>
                </a>
              )}
              {card.facebookUrl && (
                <a href={card.facebookUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded-xl flex flex-col items-center justify-center h-28">
                  <FaFacebook size={29} className="mb-2" />
                  <span>Facebook</span>
                </a>
              )}
              {card.instagramUrl && (
                <a href={card.instagramUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded-xl flex flex-col items-center justify-center h-28">
                  <FaInstagram size={29} className="mb-2" />
                  <span>Instagram</span>
                </a>
              )}
            </div>
          </div>

          {/* Links Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Links</h2>
            {card.webLinks && card.webLinks.length > 0 && (
              <div className="flex flex-col space-y-2">
                {card.webLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FaLink className="mr-2" />
                    <span>{link.displayText || link.url}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* About Me */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">About Me</h2>
          <p>{card.aboutMe}</p>
          {card.customMessage && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Custom Message</h3>
              <p>{card.customMessage}</p>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Contact</h2>
          <p className="flex items-center mb-2">
            <FaEnvelope className="mr-2" />
            {card.email}
          </p>
          <p className="flex items-center">
            <FaPhone className="mr-2" />
            {card.phoneNumber}
          </p>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Get Your Own Business Card</h3>
          <p className="text-sm mb-4">Create a modern, digital business card like this one for free. Get started now!</p>
          <Link href="/" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs transition duration-300 mb-4">
            Get Your Card
          </Link>
          <p className="text-xs">&copy; 2024 HelixCard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BusinessCardDisplay;
