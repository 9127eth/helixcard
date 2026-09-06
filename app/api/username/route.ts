import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';
import { UsernameUnavailableError, normalizeUsername, reserveUsername } from '@/app/lib/usernames';
import { consumeQuota, getClientIp } from '@/app/lib/usageQuota';

/**
 * Change the signed-in user's handle.
 *
 * `users/{uid}.username` is rejected on client writes by Firestore rules, so
 * this is the only way a handle can move — and it moves transactionally through
 * the `usernames` registry.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const body = await req.json().catch(() => ({}));
    const idToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(idToken);

    const username = normalizeUsername(body.username);
    if (!username) {
      return NextResponse.json(
        { error: 'Usernames must be 3-20 characters using lowercase letters, numbers or hyphens' },
        { status: 400 }
      );
    }

    // Stops handle-squatting sweeps without getting in a real user's way.
    const quota = await consumeQuota([
      { key: `username:user:${decodedToken.uid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      { key: `username:ip:${getClientIp(req)}`, limit: 60, windowMs: 60 * 60 * 1000 },
    ]);

    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'Too many username changes. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(quota.retryAfterSeconds) } }
      );
    }

    await reserveUsername(decodedToken.uid, username);
    return NextResponse.json({ username });
  } catch (error) {
    if (error instanceof UsernameUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error updating username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
