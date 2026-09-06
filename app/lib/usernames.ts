import { db } from './firebase-admin';

/**
 * Server-controlled username registry.
 *
 * `users/{uid}.username` used to be a client-writable field that was only
 * *checked* for availability, never reserved — two accounts could race onto the
 * same handle, and any user could simply rewrite their own document to claim
 * somebody else's. Reservations now live in `usernames/{username}`, which
 * Firestore rules deny to every client, and are taken transactionally.
 */

const RESERVATIONS = 'usernames';

/** Handles that must never be claimed because they collide with real routes. */
const RESERVED_WORDS = new Set([
  'admin', 'api', 'app', 'c', 'card', 'cards', 'contacts', 'create-card',
  'dashboard', 'discount', 'edit-card', 'get-helix-pro', 'helix', 'helixcard',
  'how-it-works', 'login', 'logout', 'presskit', 'privacy-policy', 'register',
  'reset-password', 'settings', 'shop', 'signin', 'signup', 'support',
  'terms-of-service', 'verify-email', 'www',
]);

export const USERNAME_PATTERN = /^[a-z0-9-]{3,20}$/;

export class UsernameUnavailableError extends Error {
  constructor(message = 'That username is already taken') {
    super(message);
    this.name = 'UsernameUnavailableError';
  }
}

export function normalizeUsername(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(normalized)) return null;
  if (RESERVED_WORDS.has(normalized)) return null;
  return normalized;
}

/**
 * Claim `username` for `uid`, releasing any handle the user held before.
 *
 * Throws {@link UsernameUnavailableError} when another account owns it.
 */
export async function reserveUsername(uid: string, username: string): Promise<string> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new UsernameUnavailableError('That username is not allowed');
  }

  const reservationRef = db.collection(RESERVATIONS).doc(normalized);
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async transaction => {
    const [reservation, userDoc] = await Promise.all([
      transaction.get(reservationRef),
      transaction.get(userRef),
    ]);

    if (reservation.exists && reservation.data()?.uid !== uid) {
      throw new UsernameUnavailableError();
    }

    const previous = userDoc.data()?.username;
    if (typeof previous === 'string' && previous && previous !== normalized) {
      const previousRef = db.collection(RESERVATIONS).doc(previous.toLowerCase());
      const previousReservation = await transaction.get(previousRef);
      if (previousReservation.exists && previousReservation.data()?.uid === uid) {
        transaction.delete(previousRef);
      }
    }

    transaction.set(reservationRef, { uid, createdAt: new Date() });

    // The username field on the user document is server-written from here on;
    // Firestore rules reject client writes to it.
    if (userDoc.exists) {
      transaction.update(userRef, { username: normalized });
    }
  });

  return normalized;
}

/**
 * Look up the account that owns a handle.
 *
 * Accounts created before the registry existed have no reservation, so we fall
 * back to the legacy query once and backfill a reservation for them. The
 * fallback picks the oldest matching account so a duplicate handle can never
 * hijack an established public link.
 */
export async function resolveUsername(username: unknown): Promise<string | null> {
  if (typeof username !== 'string') return null;
  const normalized = username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(normalized)) return null;

  const reservation = await db.collection(RESERVATIONS).doc(normalized).get();
  const reservedUid = reservation.data()?.uid;
  if (typeof reservedUid === 'string') return reservedUid;

  const legacy = await db
    .collection('users')
    .where('username', '==', normalized)
    .get();

  if (legacy.empty) return null;

  const oldest = legacy.docs
    .map(doc => ({
      uid: doc.id,
      registeredAt: doc.data().registeredAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.registeredAt - b.registeredAt)[0];

  // Backfill so the next lookup is a single document read and the handle is
  // locked to this account.
  try {
    await db.runTransaction(async transaction => {
      const ref = db.collection(RESERVATIONS).doc(normalized);
      const existing = await transaction.get(ref);
      if (!existing.exists) {
        transaction.set(ref, { uid: oldest.uid, createdAt: new Date(), backfilled: true });
      }
    });
  } catch (error) {
    console.error('Failed to backfill username reservation:', error);
  }

  return oldest.uid;
}

/** Drop every reservation held by an account (used during account deletion). */
export async function releaseUsernames(uid: string): Promise<void> {
  const held = await db.collection(RESERVATIONS).where('uid', '==', uid).get();
  await Promise.all(held.docs.map(doc => doc.ref.delete()));
}
