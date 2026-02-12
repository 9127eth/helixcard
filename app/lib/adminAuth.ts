import { auth } from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

// Centralized admin email list — update in one place
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
    const decodedToken = await auth.verifyIdToken(idToken);
    
    const isAdmin = 
      decodedToken.admin === true || 
      ADMIN_EMAILS.includes(decodedToken.email || '');

    if (!isAdmin) {
      return null;
    }

    return decodedToken;
  } catch {
    return null;
  }
}

