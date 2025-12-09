import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { BusinessCard } from '@/app/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; cardSlug: string }> }
) {
  const { username, cardSlug } = await params;

  try {
    // Find user by username
    const userQuery = db.collection('users').where('username', '==', username);
    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'User not found', user: { primaryCardId: null, primaryCardPlaceholder: false } }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;

    // Fetch specific business card
    const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(cardSlug);
    const cardDoc = await cardRef.get();

    if (!cardDoc.exists) {
      return NextResponse.json({ error: 'Business card not found', user: { primaryCardId: null, primaryCardPlaceholder: false } }, { status: 404 });
    }

    const cardData = { id: cardDoc.id, ...cardDoc.data() } as BusinessCard;

    return NextResponse.json({ card: cardData });
  } catch (error) {
    console.error('Error fetching business card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
