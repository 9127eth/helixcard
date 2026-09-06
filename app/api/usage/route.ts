import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';
import { syncUsage } from '@/app/lib/entitlements';

/**
 * Authoritative card/contact usage for the signed-in user.
 *
 * The browser calls this before creating a card or contact (to learn whether it
 * may, and to seed the server-side counter Firestore rules check against) and
 * after deleting one (to return the freed quota).
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const body = await req.json().catch(() => ({}));
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const usage = await syncUsage(decodedToken.uid);

    return NextResponse.json(usage, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error syncing usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
