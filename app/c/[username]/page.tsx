import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BusinessCardDisplay from '@/app/components/BusinessCardDisplay';
import { lookupPrimaryCard } from '@/app/lib/publicCardLookup';

// Owners expect an edit to show up straight away. The no-store fetch these
// pages used to make implied this; a direct Firestore read does not.
export const dynamic = 'force-dynamic';

interface BusinessCardProps {
  params: Promise<{ username: string; cardSlug?: string }>;
}

export async function generateMetadata({ params }: BusinessCardProps): Promise<Metadata> {
  const { username } = await params;

  let result: Awaited<ReturnType<typeof lookupPrimaryCard>>;
  try {
    result = await lookupPrimaryCard(username);
  } catch (error) {
    console.error('Error fetching card metadata:', error);
    return {
      title: `Error - HelixCard`,
      description: `Error loading ${username}'s digital business card`,
    };
  }

  if (!result.found) {
    return {
      title: `Card Not Found - HelixCard`,
      description: `The requested business card does not exist.`,
    };
  }

  return {
    title: `${result.card.firstName}'s Business Card - HelixCard`,
    description: `View ${result.card.firstName}'s digital business card`,
  };
}

export default async function BusinessCardPage({ params }: BusinessCardProps) {
  const { username } = await params;

  let result: Awaited<ReturnType<typeof lookupPrimaryCard>>;
  try {
    result = await lookupPrimaryCard(username);
  } catch (error) {
    console.error('Error fetching card data:', error);
    return <div>Error loading card data. Please try again later.</div>;
  }

  // Unknown usernames, and accounts whose primary card is gone or switched off,
  // answer 404 so search engines drop the URL. notFound() throws, so it stays out of the try.
  if (!result.found) notFound();

  return <BusinessCardDisplay card={result.card} isPro={result.user.isPro} />;
}
