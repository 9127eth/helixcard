import { Metadata } from 'next';
import BusinessCardDisplay from '@/app/components/BusinessCardDisplay';
import { BusinessCard } from '@/app/types';

interface BusinessCardProps {
  params: Promise<{ username: string; cardSlug: string }>;
}

interface ApiResponse {
  card: (BusinessCard & { isPro: boolean }) | null;
}

export async function generateMetadata({ params }: BusinessCardProps): Promise<Metadata> {
  const { username, cardSlug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.helixcard.app';
  const res = await fetch(`${baseUrl}/api/c/${username}/${cardSlug}`, { cache: 'no-store' });

  if (!res.ok) {
    return {};
  }

  const data = await res.json() as ApiResponse;

  if (!data.card) {
    return {
      title: 'Card Not Found - HelixCard',
      description: 'The requested business card does not exist.',
    };
  }

  const fullName = [data.card.firstName, data.card.lastName]
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.helixcard.app';

  try {
    const res = await fetch(`${baseUrl}/api/c/${username}/${cardSlug}`, { cache: 'no-store' });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Fetch error: ${res.status} ${res.statusText}`, errorText);
      return <div>Error loading card data. Please try again later.</div>;
    }

    const data = await res.json() as ApiResponse;

    console.log('API response:', data);

    if (!data.card) {
      return <div>Card not found</div>;
    }

    return <BusinessCardDisplay card={data.card} isPro={data.card.isPro} />;
  } catch (error) {
    console.error('Error fetching card data:', error);
    return <div>Error loading card data. Please try again later.</div>;
  }
}
