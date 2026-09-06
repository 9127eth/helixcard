import { db } from './firebase-admin';

/**
 * Re-derive `isActive` for every card an account owns.
 *
 * Free accounts keep only their primary card public; Pro accounts have all of
 * them public. Firestore rules enforce exactly this relationship on client
 * writes, so `isActive` can no longer be forged by a downgraded user — but the
 * flip on upgrade/downgrade has to happen with the Admin SDK, which is what
 * this does. (The Stripe webhook previously called the browser-SDK helper,
 * which cannot authenticate server-side and so silently failed.)
 */
export async function syncCardActiveStatus(uid: string, isPro: boolean): Promise<void> {
  const cardsRef = db.collection('users').doc(uid).collection('businessCards');
  const cards = await cardsRef.get();

  if (cards.empty) return;

  const batch = db.batch();
  for (const card of cards.docs) {
    const isPrimary = card.data().isPrimary === true;
    batch.update(card.ref, { isActive: isPro || isPrimary });
  }

  await batch.commit();
}
