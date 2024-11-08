export type CardTheme = 'classic' | 'modern' | 'dark';

export interface BusinessCard {
  cvUrl?: string;
  cvHeader?: string;
  cvDescription?: string;
  cvDisplayText?: string;
  id: string;
  description: string; // Add this line
  firstName: string;
  middleName?: string;
  lastName?: string; // Make lastName optional
  prefix?: string;
  credentials?: string;
  pronouns?: string;
  jobTitle?: string;
  company?: string;
  isPrimary: boolean;
  cardSlug: string;
  username: string; // Add this line if it's not already present
  facebookUrl?: string;
  instagramUrl?: string;
  linkedIn?: string;
  twitter?: string;
  aboutMe?: string;
  customMessage?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  discordUrl?: string;
  twitchUrl?: string;
  snapchatUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
  webLinks?: { url: string; displayText: string }[];
  email?: string; // Make email optional
  phoneNumber?: string;
  customMessageHeader?: string;
  threadsUrl?: string;
  imageUrl?: string; // Add this line
  isActive: boolean; // Add this line
  isPro?: boolean; // Add this line
  cardDepthColor?: string; // Add this line
  theme?: CardTheme;
}

export interface BusinessCardData {
  id?: string;
  description: string;
  firstName: string;
  middleName?: string; // Make this optional
  lastName?: string; // Make lastName optional
  jobTitle: string;
  company: string;
  phoneNumber: string;
  email?: string; // Make email optional
  aboutMe: string;
  linkedIn: string;
  twitter: string;
  customMessage: string;
  customSlug?: string;
  prefix: string;
  credentials: string;
  pronouns: string;
  facebookUrl: string;
  instagramUrl: string;
  cardSlug: string;
  isPrimary: boolean;
  tiktokUrl?: string;
  youtubeUrl?: string;
  discordUrl?: string;
  twitchUrl?: string;
  snapchatUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
  webLinks: { url: string; displayText: string }[];
  threadsUrl?: string;
  cvHeader?: string;
  cvDescription?: string;
  imageUrl?: string; // Add this line
  isActive: boolean;
  isPro?: boolean;
  cardDepthColor?: string;
  theme: CardTheme;
}



