import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { toPublicCard } from '@/app/lib/publicCard';
import { resolveUsername } from '@/app/lib/usernames';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    // Handles resolve through the reservation registry, so a duplicate
    // `username` field can no longer hijack somebody else's public link.
    const userId = await resolveUsername(username);

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.primaryCardId) {
      return NextResponse.json({ error: 'Primary card not found' }, { status: 404 });
    }

    // Fetch primary business card
    const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(userData.primaryCardId);
    const cardDoc = await cardRef.get();

    if (!cardDoc.exists) {
      return NextResponse.json({ error: 'Primary card not found' }, { status: 404 });
    }

    const cardData = cardDoc.data();
    if (!cardData || cardData.isActive === false) {
      return NextResponse.json({ error: 'Primary card not found' }, { status: 404 });
    }

    const isPro = userData.isPro === true;

    return NextResponse.json({
      user: {
        isPro,
        primaryCardId: userData.primaryCardId,
        primaryCardPlaceholder: userData.primaryCardPlaceholder || false,
      },
      // An explicit DTO: only whitelisted fields leave the server, and every
      // value that ends up in an href is restricted to http(s).
      card: toPublicCard(cardDoc.id, cardData, isPro),
    }, { headers: { 'Cache-Control': 'no-store' }, status: 200 });
  } catch (error) {
    console.error('Error fetching primary business card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
