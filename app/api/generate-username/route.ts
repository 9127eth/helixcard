import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';
import { UsernameUnavailableError, reserveUsername } from '@/app/lib/usernames';

function generateRandomSlug(): string {
  return Math.random().toString(36).substring(2, 8);
}

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Reserve a handle transactionally rather than just checking availability —
    // two concurrent registrations used to be able to pick the same username.
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const username = await reserveUsername(decodedToken.uid, generateRandomSlug());
        return NextResponse.json({ username });
      } catch (error) {
        if (!(error instanceof UsernameUnavailableError)) throw error;
      }
    }

    return NextResponse.json({ error: 'Failed to generate unique username' }, { status: 500 });
  } catch (error) {
    console.error('Error generating username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
