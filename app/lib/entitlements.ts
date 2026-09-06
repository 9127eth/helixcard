import { db } from './firebase-admin';
import {
  FREE_USER_CARD_LIMIT,
  FREE_USER_CONTACT_LIMIT,
  PRO_USER_CARD_LIMIT,
  PRO_USER_CONTACT_LIMIT,
} from './constants';

/**
 * Server-side entitlement accounting.
 *
 * Card and contact limits used to be enforced only by the browser counting
 * documents before it wrote one. The authoritative counts now live on the user
 * document as `cardCount` / `contactCount`, written exclusively by the Admin SDK
 * here. Firestore rules let a client raise a counter by exactly one (as part of
 * the same batch that creates the document) and never lower it, so the only way
 * to reclaim quota after a delete is to come back through this code path.
 */

export interface UsageSummary {
  isPro: boolean;
  cardCount: number;
  contactCount: number;
  cardLimit: number;
  contactLimit: number;
  canCreateCard: boolean;
  canCreateContact: boolean;
}

export function cardLimitFor(isPro: boolean): number {
  return isPro ? PRO_USER_CARD_LIMIT : FREE_USER_CARD_LIMIT;
}

export function contactLimitFor(isPro: boolean): number {
  return isPro ? PRO_USER_CONTACT_LIMIT : FREE_USER_CONTACT_LIMIT;
}

/**
 * Recount the user's cards and contacts and persist the totals.
 *
 * Called before any create (so the counter is seeded and accurate) and after
 * deletes (so freed quota is returned).
 */
export async function syncUsage(uid: string): Promise<UsageSummary> {
  const userRef = db.collection('users').doc(uid);

  const [userDoc, cards, contacts] = await Promise.all([
    userRef.get(),
    userRef.collection('businessCards').count().get(),
    userRef.collection('contacts').count().get(),
  ]);

  if (!userDoc.exists) {
    throw new Error('User document does not exist');
  }

  const isPro = userDoc.data()?.isPro === true;
  const cardCount = cards.data().count;
  const contactCount = contacts.data().count;

  await userRef.update({ cardCount, contactCount });

  const cardLimit = cardLimitFor(isPro);
  const contactLimit = contactLimitFor(isPro);

  // A placeholder means the primary card was deleted; the user is always allowed
  // to recreate it regardless of the count.
  const hasPlaceholder = userDoc.data()?.primaryCardPlaceholder === true;

  return {
    isPro,
    cardCount,
    contactCount,
    cardLimit,
    contactLimit,
    canCreateCard: hasPlaceholder || cardCount < cardLimit,
    canCreateContact: contactCount < contactLimit,
  };
}
