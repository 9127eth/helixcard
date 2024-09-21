import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { BusinessCard } from '@/app/types';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { deleteBusinessCard } from '../lib/firebaseOperations';

interface BusinessCardItemProps {
  card: BusinessCard;
  username: string;
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({ card, username }) => {
  const { user } = useAuth();
  const router = useRouter();
  const cardUrl = card.isPrimary ? `/c/${username}` : `/c/${username}/${card.cardSlug}`;

  const handleDelete = async () => {
    if (!user) {
      alert('You must be logged in to delete a card.');
      return;
    }

    let confirmDelete: boolean;

    if (card.isPrimary) {
      confirmDelete = confirm(
        'Deleting your primary card will deactivate your primary URL. Are you sure you want to proceed?'
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
    <div
      className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
        card.isPrimary ? 'border-blue-500' : ''
      }`}
    >
      {card.profilePictureUrl && (
        <Image
          src={card.profilePictureUrl}
          alt={`${card.name}'s profile picture`}
          width={100}
          height={100}
          className="rounded-full mb-4"
        />
      )}
      <h3 className="text-xl font-semibold">
        {card.prefix ? `${card.prefix} ` : ''}
        {card.name}
        {card.credentials ? `, ${card.credentials}` : ''}
      </h3>
      {card.pronouns && <p className="text-sm text-gray-500">{card.pronouns}</p>}
      <p className="text-gray-600">{card.jobTitle}</p>
      <p className="text-gray-600">{card.company}</p>
      {card.isPrimary && (
        <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-full mt-2">
          Primary
        </span>
      )}
      <div className="mt-4 flex space-x-2">
        {card.facebookUrl && (
          <a href={card.facebookUrl} target="_blank" rel="noopener noreferrer">
            <FaFacebook />
          </a>
        )}
        {card.instagramUrl && (
          <a href={card.instagramUrl} target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
        )}
        {card.linkedIn && (
          <a href={card.linkedIn} target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
        )}
        {card.twitter && (
          <a href={card.twitter} target="_blank" rel="noopener noreferrer">
            <FaTwitter />
          </a>
        )}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div>
          <Link href={`/edit-card/${card.id}`} className="text-indigo-600 hover:text-indigo-800 mr-4">
            Edit
          </Link>
          <Link href={cardUrl} className="text-indigo-600 hover:text-indigo-800">
            Preview
          </Link>
        </div>
        <button
          onClick={handleDelete}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
          style={{ border: '2px solid black' }} // Add this line
        >
          Delete
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        URL: https://www.helixcard.app{cardUrl}
      </p>
    </div>
  );
};
