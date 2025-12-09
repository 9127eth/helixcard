import { Metadata } from 'next';
import BusinessCardDisplay from '@/app/components/BusinessCardDisplay';

interface BusinessCardProps {
  params: Promise<{ username: string; cardSlug: string }>;
}

export async function generateMetadata({ params }: BusinessCardProps): Promise<Metadata> {
  const { username, cardSlug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.helixcard.app';
  const res = await fetch(`${baseUrl}/api/c/${username}/${cardSlug}`, { cache: 'no-store' });

  if (!res.ok) {
    return {};
  }

  const data = await res.json();

  return {
    title: `${data.card.name}'s Business Card - HelixCard`,
    description: `View ${data.card.name}'s digital business card`,
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

    const data = await res.json();

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
