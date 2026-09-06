'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, ExternalLink } from 'react-feather';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import { BusinessCardForm } from '../../components/BusinessCardForm';
import PreviewModal from '../../components/PreviewModal'; // Add this import
import { getBusinessCard, updateBusinessCard, deleteBusinessCard } from '../../lib/firebaseOperations';
import { BusinessCard, BusinessCardData } from '@/app/types';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { db } from '../../lib/firebase'; // Import Firestore database
import LoadingSpinner from '../../components/LoadingSpinner';


export default function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [cardData, setCardData] = useState<BusinessCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Add this state
  const [username, setUsername] = useState<string | null>(null); // Add this state

  useEffect(() => {
    const fetchCardData = async () => {
      if (user && id) {
        try {
          const card = await getBusinessCard(user.uid, id);
          setCardData({ ...card, id: id } as BusinessCardData);

          // Fetch the user's username
          if (db) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUsername(userData.username);
            }
          } else {
            console.error('Firestore database is not initialized');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setCardData(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCardData();
  }, [user, id]);

  const handleSuccess = async (updatedCardData: BusinessCardData) => {
    if (user && id) {
      try {
        await updateBusinessCard(user.uid, id, updatedCardData);
        // Show a success message
        alert('Business card updated successfully.');
      } catch (error) {
        console.error('Error updating business card:', error);
        throw error;
      }
    }
  };

  const handleDelete = async () => {
    if (user && id) {
      try {
        await deleteBusinessCard(user, id);
        alert('Business card deleted successfully.');
        router.push('/dashboard');
      } catch (error) {
        console.error('Error deleting business card:', error);
        alert('Failed to delete business card. Please try again.');
      }
    }
  };

  const handlePreviewToggle = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  // Construct the card URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.helixcard.app';
  const cardUrl = cardData && username
    ? (cardData.isPrimary
        ? `${baseUrl}/c/${username}`
        : `${baseUrl}/c/${username}/${cardData.cardSlug}`)
    : null;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!cardData) {
    return (
      <Layout title="Edit Business Card - HelixCard">
        <div className="px-4 py-16 font-sans sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#2c2d31]">
            <h1 className="text-xl font-semibold tracking-tight">Card not found</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This card may have been deleted, or the link is out of date.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:brightness-95"
            >
              <ArrowLeft size={16} />
              Back to my cards
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isActive = cardData.isActive !== false;
  const displayUrl = cardUrl ? cardUrl.replace(/^https?:\/\/(www\.)?/, '') : null;

  return (
    <Layout title="Edit Business Card - HelixCard">
      <div className="px-4 pb-16 pt-2 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Page header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft size={15} />
                My cards
              </Link>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Edit card</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {cardData.description && (
                  <span className="inline-flex max-w-[16rem] items-center truncate rounded-full bg-gray-900/[0.06] px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200">
                    {cardData.description}
                  </span>
                )}
                {cardData.isPrimary && (
                  <span className="inline-flex items-center rounded-full bg-[#7CCEDA]/20 px-2.5 py-1 text-xs font-semibold text-[#2E7C89] dark:text-[#7CCEDA]">
                    Primary
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                      : 'bg-gray-500/10 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                {cardUrl && displayUrl && (
                  <a
                    href={cardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 text-xs text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <span className="truncate">{displayUrl}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handlePreviewToggle}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7CCEDA]/30 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10"
            >
              <Eye size={16} />
              View saved card
            </button>
          </div>

          <BusinessCardForm
            initialData={cardData}
            onSuccess={handleSuccess}
            onDelete={handleDelete}
            isEditing={true}
          />
        </div>

        {cardData && cardUrl && (
          <PreviewModal
            isOpen={isPreviewOpen}
            onClose={handlePreviewToggle}
            card={{
              ...cardData,
              isPrimary: cardData.isPrimary || false,
              cardSlug: cardData.cardSlug || '',
              lastName: cardData.lastName || '',
              email: cardData.email || '',
            } as BusinessCard}
            username={username || ''}
          />
        )}
      </div>
    </Layout>
  );
}
