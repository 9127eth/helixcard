import { Metadata } from 'next';
import BusinessCardDisplay from '@/app/components/BusinessCardDisplay';
import { BusinessCard } from '@/app/types';

interface BusinessCardProps {
  params: { username: string; cardSlug?: string };
}

interface ApiResponse {
  user: {
    primaryCardId: string | null;
    primaryCardPlaceholder: boolean;
  };
  card: BusinessCard | null;
}

export async function generateMetadata({ params }: BusinessCardProps): Promise<Metadata> {
  const { username } = params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://www.helixcard.app' : 'http://localhost:3000');
  const res = await fetch(`${baseUrl}/api/c/${username}`, { cache: 'no-store' });

  if (!res.ok) {
    return {
      title: `Error - HelixCard`,
      description: `Error loading ${username}'s digital business card`,
    };
  }

  const data = await res.json() as ApiResponse;

  if (data.card) {
    return {
      title: `${data.card.firstName}'s Business Card - HelixCard`,
      description: `View ${data.card.firstName}'s digital business card`,
    };
  } else if (data.user.primaryCardId === null && data.user.primaryCardPlaceholder) {
    return {
      title: `Business Card Placeholder - HelixCard`,
      description: `This business card is currently unavailable.`,
    };
  } else {
    return {
      title: `Card Not Found - HelixCard`,
      description: `The requested business card does not exist.`,
    };
  }
}

export default async function BusinessCardPage({ params }: BusinessCardProps) {
  const { username } = params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://www.helixcard.app' : 'http://localhost:3000');

  try {
    const res = await fetch(`${baseUrl}/api/c/${username}`, { cache: 'no-store' });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Fetch error: ${res.status} ${res.statusText}`, errorText);
      return <div>Error loading card data. Please try again later.</div>;
    }

    const data: ApiResponse = await res.json();

    if (data.card) {
      return <BusinessCardDisplay card={data.card} />;
    } else if (data.user.primaryCardId === null && data.user.primaryCardPlaceholder) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
          <h1 className="text-2xl font-bold mb-4 text-red-500">This business card is currently unavailable.</h1>
          <p className="text-lg text-gray-700">Please create a new primary business card to reactivate your primary URL.</p>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Card not found</h1>
          <p className="text-lg text-gray-700">The requested business card does not exist.</p>
        </div>
      );
    }
  } catch (error) {
    console.error('Error fetching card data:', error);
    return <div>Error loading card data. Please try again later.</div>;
  }
}
