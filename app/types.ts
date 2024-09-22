export interface BusinessCard {
  id: string;
  description: string; // Add this line
  name: string;
  prefix?: string;
  credentials?: string;
  pronouns?: string;
  jobTitle?: string;
  company?: string;
  isPrimary: boolean;
  cardSlug: string;
  profilePictureUrl?: string | null;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedIn?: string;
  twitter?: string;
}

export interface BusinessCardData {
  id?: string;
  description: string; // Add this line
  name: string;
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
}


