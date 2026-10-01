import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BusinessCardDisplay from '@/app/components/BusinessCardDisplay';
import { lookupCardBySlug } from '@/app/lib/publicCardLookup';

// Owners expect an edit to show up straight away. The no-store fetch these
// pages used to make implied this; a direct Firestore read does not.
export const dynamic = 'force-dynamic';

interface BusinessCardProps {
  params: Promise<{ username: string; cardSlug: string }>;
}

export async function generateMetadata({ params }: BusinessCardProps): Promise<Metadata> {
  const { username, cardSlug } = await params;

  let result: Awaited<ReturnType<typeof lookupCardBySlug>>;
  try {
    result = await lookupCardBySlug(username, cardSlug);
  } catch (error) {
    console.error('Error fetching card metadata:', error);
    return {};
  }

  if (!result.found) {
    return { title: 'Card Not Found - HelixCard' };
  }

  const fullName = [result.card.firstName, result.card.lastName]
    .filter((namePart): namePart is string => Boolean(namePart?.trim()))
    .map(namePart => namePart.trim())
    .join(' ') || 'HelixCard Member';

  return {
    title: fullName,
    description: `View ${fullName}'s digital business card`,
  };
}

export default async function BusinessCardPage({ params }: BusinessCardProps) {
  const { username, cardSlug } = await params;

  let result: Awaited<ReturnType<typeof lookupCardBySlug>>;
  try {
    result = await lookupCardBySlug(username, cardSlug);
  } catch (error) {
    console.error('Error fetching card data:', error);
    return <div>Error loading card data. Please try again later.</div>;
  }

  // Missing and switched-off cards answer 404, so search engines drop the URL
  // rather than index an error message. notFound() throws, so it stays out of the try.
  if (!result.found) notFound();

  return <BusinessCardDisplay card={result.card} isPro={result.card.isPro === true} />;
}
