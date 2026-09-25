import type { BusinessCard } from '../../types';

/** The published card the home page demos, so visitors see exactly what a real card looks like. */
export const DEMO_CARD_PATH = '/c/9odg5w/kq9';
export const DEMO_CARD_URL = `https://www.helixcard.app${DEMO_CARD_PATH}`;

/** Jordan Lane's card as published in September 2026, used when the live copy can't be fetched. */
const DEMO_CARD_SNAPSHOT: BusinessCard = {
  id: 'kq9',
  isPrimary: false,
  isActive: true,
  isPro: true,
  enableTextMessage: true,
  webLinks: [{ url: 'https://brighthealthrx.com/', displayText: 'BrightHealth Website' }],
  customColors: null,
  effectTour: true,
  description: 'Pharmacy',
  firstName: 'Jordan',
  lastName: 'Lane',
  credentials: 'PharmD',
  jobTitle: 'Pharmacist',
  company: 'Bright Health Pharmacy',
  cardSlug: 'kq9',
  username: '9odg5w',
  theme: 'classic',
  facebookUrl: 'https://facebook.com/',
  linkedIn: 'https://linkedin.com/',
  imageUrl:
    'https://firebasestorage.googleapis.com/v0/b/helixcardapp.appspot.com/o/images%2FER2CU1uSV0QqMYweHYR2eZ5HAxt2%2Fjordan%20lane.png?alt=media&token=771608f9-256a-4a6f-a1dc-82bdb6a07867',
  phoneNumber: '+15219876543',
  email: 'jordan.lane@brighthealthrx.com',
};

/** Fetch the live demo card through the public API, refreshed every ten minutes. */
export async function loadDemoCard(): Promise<BusinessCard> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.helixcard.app';

  try {
    const res = await fetch(`${baseUrl}/api${DEMO_CARD_PATH}`, { next: { revalidate: 600 } });
    if (!res.ok) return DEMO_CARD_SNAPSHOT;
    const data = (await res.json()) as { card?: BusinessCard | null };
    return data.card?.firstName ? data.card : DEMO_CARD_SNAPSHOT;
  } catch {
    return DEMO_CARD_SNAPSHOT;
  }
}
