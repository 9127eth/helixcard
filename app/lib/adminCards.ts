import { db } from './firebase-admin';

/**
 * Re-derive `isPrimary` and `isActive` for every card an account owns.
 *
 * Free accounts keep only their primary card public; Pro accounts have all of
 * them public. Firestore rules enforce exactly this relationship on client
 * writes, so `isActive` can no longer be forged by a downgraded user — but the
 * flip on upgrade/downgrade has to happen with the Admin SDK, which is what
 * this does. (The Stripe webhook previously called the browser-SDK helper,
 * which cannot authenticate server-side and so silently failed.)
 *
 * Call it after writing the owner's plan. The plan is read back here rather
 * than passed in, so two updates finishing out of order (a subscription
 * reconcile and a lifetime grant, say) cannot leave the cards on the older one.
 */
export async function syncCardActiveStatus(uid: string): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  const [userDoc, cards] = await Promise.all([
    userRef.get(),
    userRef.collection('businessCards').get(),
  ]);

  if (cards.empty) return;

  const isPro = userDoc.data()?.isPro === true;

  // Primacy comes from the owner document, never the card's own flag: the rules
  // only check the fields a write touches, so a stale or self-set `isPrimary`
  // would otherwise keep extra cards public after a downgrade.
  const primaryCardId = userDoc.data()?.primaryCardId;

  const batch = db.batch();
  for (const card of cards.docs) {
    const isPrimary = card.id === primaryCardId;
    batch.update(card.ref, { isPrimary, isActive: isPro || isPrimary });
  }

  await batch.commit();
}
