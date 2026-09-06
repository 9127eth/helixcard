import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { toPublicCard } from '@/app/lib/publicCard';
import { resolveUsername } from '@/app/lib/usernames';

const NOT_FOUND_BODY = {
  error: 'Business card not found',
  user: { primaryCardId: null, primaryCardPlaceholder: false },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; cardSlug: string }> }
) {
  const { username, cardSlug } = await params;

  try {
    const userId = await resolveUsername(username);

    if (!userId) {
      return NextResponse.json(
        { ...NOT_FOUND_BODY, error: 'User not found' },
        { status: 404 }
      );
    }

    const userDoc = await db.collection('users').doc(userId).get();

    // Fetch specific business card
    const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(cardSlug);
    const cardDoc = await cardRef.get();

    if (!cardDoc.exists) {
      return NextResponse.json(NOT_FOUND_BODY, { status: 404 });
    }

    const cardData = cardDoc.data();

    // A card is only public while it is active. Free accounts (and accounts
    // that downgraded) keep just their primary card published; without this
    // check every extra card stayed reachable.
    if (!cardData || cardData.isActive === false) {
      return NextResponse.json(NOT_FOUND_BODY, { status: 404 });
    }

    // The owner document is authoritative; card.isPro can be stale or client-written.
    const isPro = userDoc.data()?.isPro === true;

    return NextResponse.json(
      { card: toPublicCard(cardDoc.id, cardData, isPro) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching business card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
