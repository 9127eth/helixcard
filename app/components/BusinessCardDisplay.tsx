'use client';

import React from 'react';
import Image from 'next/image';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { deleteBusinessCard } from '../lib/firebaseOperations';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { BusinessCard } from '@/app/types';

interface BusinessCardDisplayProps {
  card: BusinessCard;
}

const BusinessCardDisplay: React.FC<BusinessCardDisplayProps> = ({ card }) => {
  const { user } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    if (!user) {
      alert('You must be logged in to delete a card.');
      return;
    }

    let confirmDelete: boolean;

    if (card.isPrimary) {
      const confirm = window.confirm(
        'Deleting your primary card will deactivate your primary URL. Are you sure you want to proceed?'
      );
      if (!confirm) return;
    }

    if (card.isPrimary) {
      confirmDelete = confirm(
        'You are about to delete your primary business card. The primary URL will be reserved as a placeholder until you create a new primary card. Do you wish to continue?'
      );
    } else {
      confirmDelete = confirm('Are you sure you want to delete this business card?');
    }

    if (!confirmDelete) return;

    try {
      await deleteBusinessCard(user, card.cardSlug);
      alert('Business card deleted successfully.');
      router.refresh(); // Refresh the page or redirect as needed
    } catch (error: unknown) {
      console.error('Error deleting business card:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="business-card max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      {card.profilePictureUrl && (
        <Image
          src={card.profilePictureUrl}
          alt={`${card.firstName} ${card.middleName ? card.middleName + ' ' : ''}${card.lastName}'s profile picture`}
          width={100}
          height={100}
          className="rounded-full mb-4 mx-auto"
        />
      )}
      {/* Removed description */}
      <h1 className="text-2xl font-bold mb-2">
        {card.prefix ? `${card.prefix} ` : ''}
        {card.firstName}
        {card.middleName ? ` ${card.middleName} ` : ' '}
        {card.lastName}
        {card.credentials ? `, ${card.credentials}` : ''}
      </h1>
      {card.pronouns && <p className="text-sm text-gray-500 mb-2">{card.pronouns}</p>}
      <p className="text-xl text-gray-700 mb-1">{card.jobTitle}</p>
      <p className="text-lg text-gray-600 mb-4">{card.company}</p>
      
      {card.aboutMe && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">About Me</h2>
          <p className="text-gray-700">{card.aboutMe}</p>
        </div>
      )}
      
      {card.customMessage && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Custom Message</h2>
          <p className="text-gray-700">{card.customMessage}</p>
        </div>
      )}

      <div className="flex justify-center space-x-4 mb-4">
        {card.facebookUrl && (
          <a href={card.facebookUrl} target="_blank" rel="noopener noreferrer">
            <FaFacebook size={24} />
          </a>
        )}
        {card.instagramUrl && (
          <a href={card.instagramUrl} target="_blank" rel="noopener noreferrer">
            <FaInstagram size={24} />
          </a>
        )}
        {card.linkedIn && (
          <a href={card.linkedIn} target="_blank" rel="noopener noreferrer">
            <FaLinkedin size={24} />
          </a>
        )}
        {card.twitter && (
          <a href={card.twitter} target="_blank" rel="noopener noreferrer">
            <FaTwitter size={24} />
          </a>
        )}
      </div>
      {/* Removed primary card indicator */}
      <button
        onClick={handleDelete}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
      >
        Delete Card
      </button>
    </div>
  );
};

export default BusinessCardDisplay;
