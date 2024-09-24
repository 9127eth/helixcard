'use client';

import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaTiktok, FaYoutube, FaDiscord, FaTwitch, FaSnapchat, FaTelegram, FaWhatsapp, FaLink, FaPhone, FaEnvelope, FaPaperPlane, FaDownload, FaAt } from 'react-icons/fa';
import { BusinessCard } from '@/app/types';
import Link from 'next/link';

interface BusinessCardDisplayProps {
  card: BusinessCard;
}

const BusinessCardDisplay: React.FC<BusinessCardDisplayProps> = ({ card }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-full h-full flex flex-col">
      <header className="bg-gray-900 text-white py-4 sm:py-6 lg:py-8 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                {card.prefix} {card.firstName} {card.middleName} {card.lastName}
                {(card.credentials || card.pronouns) && (
                  <span className="text-lg ml-2 text-gray-400">
                    {card.credentials}
                    {card.credentials && card.pronouns && " "}
                    {card.pronouns && (
                      <span className="text-sm italic text-gray-400">
                        ({card.pronouns})
                      </span>
                    )}
                  </span>
                )}
              </h1>
              <p className="text-lg sm:text-xl">
                {card.jobTitle} {card.company && <span className="text-gray-400">| {card.company}</span>}
              </p>
              {/* Remove the separate pronouns line */}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-2 sm:py-4 flex-shrink-0">
        <div className="flex justify-center space-x-4">
          <button className="bg-black text-white px-3 sm:px-5 py-1 sm:py-2 rounded-full flex items-center hover:bg-gray-800 transition duration-300 text-xs sm:text-sm">
            <FaPaperPlane className="mr-2" />
            Send a Text
          </button>
          <button className="bg-white text-black px-3 sm:px-5 py-1 sm:py-2 rounded-full flex items-center border border-black hover:bg-gray-100 transition duration-300 text-xs sm:text-sm">
            <FaDownload className="mr-2" />
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
              {(card.email || card.phoneNumber) && (
                <div className="order-1 md:order-none">
                  <h2 className="text-2xl font-bold mb-4">Contact</h2>
                  {card.email && (
                    <p className="flex items-center mb-2">
                      <FaEnvelope className="mr-2" />
                      {card.email}
                    </p>
                  )}
                  {card.phoneNumber && (
                    <p className="flex items-center">
                      <FaPhone className="mr-2" />
                      {card.phoneNumber}
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
                    {card.threadsUrl && (
                      <a href={card.threadsUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-200 p-4 rounded-xl flex flex-col items-center justify-center h-28">
                        <FaAt size={29} className="mb-2" />
                        <span>Threads</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Links Section */}
            {card.webLinks && card.webLinks.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Links</h2>
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
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-4 sm:py-6 lg:py-8 mt-4 sm:mt-6 lg:mt-8 flex-shrink-0">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Get Your Own Business Card</h3>
          <p className="text-sm mb-4">Create a modern, digital business card like this one for free. Get started now!</p>
          <Link 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs transition duration-300 mb-4"
          >
            Get Your Card
          </Link>
          <p className="text-xs">&copy; 2024 HelixCard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BusinessCardDisplay;
