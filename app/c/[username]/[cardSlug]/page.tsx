import { Metadata } from 'next';
import BusinessCardDisplay from '@/app/components/BusinessCardDisplay';

interface BusinessCardProps {
  params: { username: string; cardSlug: string };
}

export async function generateMetadata({ params }: BusinessCardProps): Promise<Metadata> {
  const { username, cardSlug } = params;
  const res = await fetch(`/api/c/${username}/${cardSlug}`);
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
  const { username, cardSlug } = params;
  try {
    const res = await fetch(`/api/c/${username}/${cardSlug}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Fetch error: ${res.status} ${res.statusText}`, errorText);
      return <div>Error loading card data. Please try again later.</div>;
    }
    const data = await res.json();

    if (!data.card) {
      return <div>Card not found</div>;
    }

    return <BusinessCardDisplay card={data.card} />;
  } catch (error) {
    console.error('Error fetching card data:', error);
    return <div>Error loading card data. Please try again later.</div>;
  }
}
