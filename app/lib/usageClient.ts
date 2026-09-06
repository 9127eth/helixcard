import { auth } from './firebase';

/**
 * Browser-side wrapper around `/api/usage`.
 *
 * Card and contact limits are decided by the server: it recounts with the Admin
 * SDK, writes the authoritative totals onto the user document and tells us what
 * the account may still create. Firestore rules then check the write against
 * those totals, so the browser can no longer talk itself past a limit.
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

export async function syncUsage(): Promise<UsageSummary | null> {
  const user = auth?.currentUser;
  if (!user) return null;

  try {
    const idToken = await user.getIdToken();
    const response = await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) return null;
    return (await response.json()) as UsageSummary;
  } catch (error) {
    console.error('Failed to sync usage:', error);
    return null;
  }
}

/**
 * Return quota freed by a delete. Fire-and-forget: the counter is only ever too
 * high until this lands, which costs the user nothing but a retry.
 */
export function refreshUsageAfterDelete(): void {
  void syncUsage();
}
