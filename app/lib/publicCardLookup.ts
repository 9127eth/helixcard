import { db } from './firebase-admin';
import { toPublicCard } from './publicCard';
import { resolveUsername } from './usernames';
import type { BusinessCard } from '@/app/types';

/**
 * Public card lookups, shared by the `/api/c/...` routes and the `/c/...` pages.
 *
 * The pages used to fetch the site's own API over HTTP. That base URL is fixed
 * at build time, so dev and preview deployments rendered production cards, and
 * a network error in generateMetadata became a 500.
 */

export type CardLookup<T> = ({ found: true } & T) | { found: false; error: string };

export interface PrimaryCard {
  user: {
    isPro: boolean;
    primaryCardId: string;
    primaryCardPlaceholder: boolean;
  };
  card: BusinessCard;
}

/** The account's main card, served at `/c/{username}`. */
export async function lookupPrimaryCard(username: string): Promise<CardLookup<PrimaryCard>> {
  // Handles resolve through the reservation registry, so a duplicate
  // `username` field can no longer hijack somebody else's public link.
  const userId = await resolveUsername(username);

  if (!userId) {
    return { found: false, error: 'User not found' };
  }

  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData?.primaryCardId) {
    return { found: false, error: 'Primary card not found' };
  }

  const cardDoc = await db
    .collection('users')
    .doc(userId)
    .collection('businessCards')
    .doc(userData.primaryCardId)
    .get();
  const cardData = cardDoc.data();

  if (!cardDoc.exists || !cardData || cardData.isActive === false) {
    return { found: false, error: 'Primary card not found' };
  }

  const isPro = userData.isPro === true;

  return {
    found: true,
    user: {
      isPro,
      primaryCardId: userData.primaryCardId,
      primaryCardPlaceholder: userData.primaryCardPlaceholder || false,
    },
    // An explicit DTO: only whitelisted fields leave the server, and every
    // value that ends up in an href is restricted to http(s).
    card: toPublicCard(cardDoc.id, cardData, isPro),
  };
}

/** One of the account's cards, served at `/c/{username}/{cardSlug}`. */
export async function lookupCardBySlug(
  username: string,
  cardSlug: string
): Promise<CardLookup<{ card: BusinessCard }>> {
  const userId = await resolveUsername(username);

  if (!userId) {
    return { found: false, error: 'User not found' };
  }

  const userDoc = await db.collection('users').doc(userId).get();
  const cardDoc = await db.collection('users').doc(userId).collection('businessCards').doc(cardSlug).get();
  const cardData = cardDoc.data();

  if (!cardDoc.exists || !cardData) {
    return { found: false, error: 'Business card not found' };
  }

  // The owner document is authoritative; card.isPro can be stale or client-written.
  const userData = userDoc.data();
  const isPro = userData?.isPro === true;

  // A card is public only while it is active, and a free account publishes
  // just its main card. The card's own isActive/isPrimary flags cannot decide
  // that alone: the rules only check the fields a write touches, so a
  // downgraded client could keep them true.
  if (cardData.isActive === false || !(isPro || cardDoc.id === userData?.primaryCardId)) {
    return { found: false, error: 'Business card not found' };
  }

  return { found: true, card: toPublicCard(cardDoc.id, cardData, isPro) };
}
