import React from 'react';
import Image from 'next/image';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';

interface BusinessCard {
  id: string;
  name: string;
  prefix: string;
  credentials: string;
  pronouns: string;
  jobTitle: string;
  company: string;
  isPrimary: boolean;
  cardSlug: string;
  profilePictureUrl: string | null;
  facebookUrl: string;
  instagramUrl: string;
  linkedIn: string;
  twitter: string;
}

interface BusinessCardDisplayProps {
  card: BusinessCard;
}

const BusinessCardDisplay: React.FC<BusinessCardDisplayProps> = ({ card }) => {
  return (
    <div className="business-card max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      {card.profilePictureUrl && (
        <Image
          src={card.profilePictureUrl}
          alt={`${card.name}'s profile picture`}
          width={100}
          height={100}
          className="rounded-full mb-4 mx-auto"
        />
      )}
      <h1 className="text-2xl font-bold mb-2">
        {card.prefix} {card.name} {card.credentials}
      </h1>
      {card.pronouns && <p className="text-sm text-gray-500 mb-2">{card.pronouns}</p>}
      <p className="text-xl text-gray-700 mb-1">{card.jobTitle}</p>
      <p className="text-lg text-gray-600 mb-4">{card.company}</p>
      <div className="flex justify-center space-x-4 mb-4">
        {card.facebookUrl && <a href={card.facebookUrl} target="_blank" rel="noopener noreferrer"><FaFacebook size={24} /></a>}
        {card.instagramUrl && <a href={card.instagramUrl} target="_blank" rel="noopener noreferrer"><FaInstagram size={24} /></a>}
        {card.linkedIn && <a href={card.linkedIn} target="_blank" rel="noopener noreferrer"><FaLinkedin size={24} /></a>}
        {card.twitter && <a href={card.twitter} target="_blank" rel="noopener noreferrer"><FaTwitter size={24} /></a>}
      </div>
      {card.isPrimary && (
        <p className="text-sm text-center text-blue-500">Primary Card</p>
      )}
    </div>
  );
};

export default BusinessCardDisplay;
