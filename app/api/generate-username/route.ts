import { NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebase-admin';

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
    await auth.verifyIdToken(idToken);

    // Generate a unique username using admin SDK (bypasses Firestore rules)
    let username = generateRandomSlug();
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const usersSnapshot = await db.collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        isUnique = true;
      } else {
        username = generateRandomSlug();
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique username' }, { status: 500 });
    }

    return NextResponse.json({ username });
  } catch (error) {
    console.error('Error generating username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

