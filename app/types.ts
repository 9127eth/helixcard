export interface BusinessCard {
  id: string;
  description: string; // Add this line
  firstName: string;
  middleName?: string;
  lastName: string;
  prefix?: string;
  credentials?: string;
  pronouns?: string;
  jobTitle?: string;
  company?: string;
  isPrimary: boolean;
  cardSlug: string;
  username: string; // Add this line if it's not already present
  profilePictureUrl?: string | null;
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
  email?: string;
  phoneNumber?: string;
  customMessageHeader?: string;
}

export interface BusinessCardData {
  id?: string;
  description: string;
  firstName: string;
  middleName?: string; // Make this optional
  lastName: string;
  jobTitle: string;
  company: string;
  phoneNumber: string;
  email: string;
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
  profilePicture?: File;
  cv?: File;
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
}


