import { auth } from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Fallback admin list.
 *
 * The `admin` custom claim is the real access control — it can only be set with
 * the Admin SDK. This list stays as a bootstrap path, but a matching email is
 * only honoured when Firebase has verified it AND the account signs in with a
 * federated provider or a verified password account. Without the verification
 * check, anyone who could register an unclaimed address would inherit admin.
 */
const ADMIN_EMAILS: string[] = [
  'richard.waithe@medvize.com',
  // Add other admin emails as needed
];

/**
 * Verify an ID token and check admin access.
 * Returns the decoded token if the user is an admin, or null otherwise.
 */
export async function verifyAdminAccess(idToken: string): Promise<DecodedIdToken | null> {
  try {
    // `true` also rejects tokens for users whose sessions have been revoked.
    const decodedToken = await auth.verifyIdToken(idToken, true);

    if (decodedToken.admin === true) {
      return decodedToken;
    }

    const email = decodedToken.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.some(allowed => allowed.toLowerCase() === email)) {
      return null;
    }

    // An email claim is only meaningful once Firebase has verified it. Read the
    // live user record rather than trusting `email_verified` in a token that may
    // predate an email change.
    const user = await auth.getUser(decodedToken.uid);
    if (!user.emailVerified || user.email?.toLowerCase() !== email) {
      console.warn('Admin email match rejected: email is not verified');
      return null;
    }

    if (user.disabled) {
      return null;
    }

    return decodedToken;
  } catch {
    return null;
  }
}
